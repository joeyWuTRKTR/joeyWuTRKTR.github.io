---
title: "資料庫多數據源及讀寫分離(Mybatis & JOOQ)"
date: 2023-09-14T07:43:42+08:00
slug: database-read-write-splitting
categories:
- Database
- Mybatis
- JOOQ
- Java
---

## 介紹讀寫分離
產品使用人數的增加，隨之不可避免的資料庫負擔增加  
單一查詢變慢、頻繁查詢都有機率造成資料庫Container crash

資料庫的資源供不應求的情況下  
可以將資料庫分為主庫（以下簡稱Master，專門寫入的資料庫，也有讀取，但是壓力不大）以及從庫（以下簡稱Slave，專門讀取的資料庫）  
藉由將“讀”跟“寫”拆開，來分擔資料庫的負擔，降低只有單一資料庫crash的風險

例如：  
原本只有一個資料庫A  
現在將原本資料庫改成master A，專門做寫入以及快速查詢  
新增三個Slave資料庫（B, C, D），將查詢較久或者頻繁查詢的SQL分散給三個Slave資料庫  
如果其中一個Slave資料庫D死掉了，還有兩個Slave資料庫(B, C)可以頂替

## 專案現況
1. 資料表已經使用了索引來滿足資料庫查詢
2. 人力資源、經驗的不足，短期無法將資料庫運算的演算法在業務層實現
3. 將資料庫版本升級風險高且不確定是否會顯著改善查詢效能

所以我們計畫將讀取較耗資源、頻繁查詢的SQL  
改成在專門讀取的資料庫搜尋並且多開幾個Slave Database Container降低讀取搞掛寫入資料庫的機率

另外Java本身也適合做多數據源的讀寫分離  
Spring boot框架自帶AOP工具  
使用註解達到對業務程式碼無侵入且使用方便的切換主從資料庫  
只需實現自動連接主從庫的設定

## 專案架構
![datasource-structure](img/20230914-database-read-write-splitting/datasource-structure.png)

### DynamicDataSourceEnum.java
將Master&Slave寫成Enum，方便使用
```java
package config.datasource;

public enum DynamicDataSourceEnum {
  MASTER("master"),
  SLAVE("slave");

  private String dataSourceName;

  DynamicDataSourceEnum(String dataSourceName) {
    this.dataSourceName = dataSourceName;
  }

  public String getDataSourceName() {
    return this.dataSourceName;
  }
}
```


### DataSourceContextHolder.java
ThreadLocal作為一個線程，紀錄Master/Slave資料源名稱

```java
package config.datasource;

public class DataSourceContextHolder {
  private static final ThreadLocal<String> DYNAMIC_DATASOURCE_CONTEXT = new ThreadLocal<>();
  public static void set(String datasourceType) {
    DYNAMIC_DATASOURCE_CONTEXT.set(datasourceType);
  }
  public static String get() {
    return DYNAMIC_DATASOURCE_CONTEXT.get();
  }
  public static void clear() {
    DYNAMIC_DATASOURCE_CONTEXT.remove();
  }
}
```

### DynamicDataSource.java
繼承AbstractRoutingDataSource
AbstractRoutingDataSource用途
1. 依據key查找對應資料源
2. 設定default資料源(寫在下方DBConfiguration.java)
3. 設定多數據源(寫在下方DBConfiguration.java)

```java
package config.datasource;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

public class DynamicDataSource extends AbstractRoutingDataSource {
  @Override
  protected Object determineCurrentLookupKey() {
    return DataSourceContextHolder.get();
  }
}
```

對應父類AbstractRoutingDataSource裡的determineTargetDataSource  
Override DynamicDataSource的determineCurrentLookupKey方法  
藉由key來找到對應的數據源，最後交由Spring Boot管理資料庫連線(getConnection)

AbstractRoutingDataSource.java
```java
protected DataSource determineTargetDataSource() {
  Assert.notNull(this.resolvedDataSources, "DataSource router not initialized");
  Object lookupKey = this.determineCurrentLookupKey();
  DataSource dataSource = (DataSource)this.resolvedDataSources.get(lookupKey);
  if (dataSource == null && (this.lenientFallback || lookupKey == null)) {
    dataSource = this.resolvedDefaultDataSource;
  }
   
  if (dataSource == null) {
    throw new IllegalStateException("Cannot determine target DataSource for lookup key [" + lookupKey + "]");
  } else {
    return dataSource;
  }
}

public Connection getConnection() throws SQLException {
  return this.determineTargetDataSource().getConnection();
}

public Connection getConnection(String username, String password) throws SQLException {
  return this.determineTargetDataSource().getConnection(username, password);
}
```

### DataSourceBuilder.java
初始化資料庫基本資訊(Alibaba的DruidDataSource寫DataSourceBuilder)

pom.xml
```xml
<dependency>
   <groupId>com.alibaba</groupId>
   <artifactId>druid</artifactId>
</dependency>
```

DataSourceBuilder.java
```java
package config.datasource;

import com.alibaba.druid.pool.DruidDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.SQLException;

public class DataSourceBuilder {
  private static final Logger logger =
          LoggerFactory.getLogger(DataSourceBuilder.class);

  private static final String mysqlDriverName = "com.mysql.jdbc.Driver";
  private static final String mysqlUrlPrefix = "jdbc:mysql://";
  private static final String mysqlUrlPostfix = "?useUnicode=true&characterEncoding=utf-8&useSSL=false";

  public DataSource dataSourceBuilder(
          String host,
          int port,
          String database,
          String userName,
          String password
  ) throws SQLException {
    DruidDataSource dataSource = new DruidDataSource();
    dataSource.setDriverClassName(mysqlDriverName);
    dataSource.setUrl(mysqlUrlPrefix + host + ":" + port + "/" + database + mysqlUrlPostfix);
    dataSource.setUsername(userName);
    dataSource.setPassword(password);

    try {
      dataSource.init();
      return dataSource;
    } catch (SQLException var6) {
      logger.error("init dataSource(" + dataSource.getUrl() + ") fail", var6);
      throw var6;
    }
  }
}

```

### MysqlMasterDataSource.java & MysqlSlaveDataSource.java
將application.yaml檔案中的資料庫變數  
透過上述DataSourceBuilder建立成MasterDataSource & SlaveDataSource

1. MysqlMasterDataSource -> 寫入用資料源
2. MysqlSlaveDataSource -> 讀取用資料源

以寫入用資料源為例  
class加上@Component，宣告給spring boot管理class  
透過@Value引入applicaiton.yaml檔案的資料庫連線所需變數  
(讀取用資料源寫法同下)
```java
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.SQLException;

@Component
public class MysqlMasterDataSource extends DataSourceBuilder{

  @Value("${mysql.host}")
  private String host;
  
  @Value("${mysql.port}")
  private int port;
  
  @Value("${mysql.database}")
  private String database;
  
  @Value("${mysql.username}")
  private String userName;

  @Value("${mysql.password}")
  private String password;


  @Bean("dataSource")
  public DataSource dataSource() throws SQLException {
    return this.dataSourceBuilder(
        this.host,
        this.port,
        this.database,
        this.userName,
        this.password
    );
  }
}
```

### DBConfiguration.java
#### 在DBConfiguration.java檔案中，加入@Configuration以及@MapperScan

1. @Configuration告訴Spring boot，這個Class作為資料庫配置給Spring boot管理
2. @MapperScan是Mybatis的註解，所有在xml檔寫下mapper的檔案，都會依照掃描的規則讀取
   - annotationClass: 讀取@Mapper註解的class
   - basePackages: 指定要掃描的檔案
   - sqlSessionFactoryRef: reference
```JAVA
@Configuration
@MapperScan(
    annotationClass = Mapper.class,
    basePackages = "dao.mysql",
    sqlSessionFactoryRef = "SqlSessionFactoryRef")
```

#### 透過建構函式把master/slave datasource引入
```java
  private final MysqlMasterDataSource mysqlMasterDataSource;
  private final MysqlSlaveDataSource mysqlSlaveDataSource;

  public DBConfiguration (
          MysqlMasterDataSource mysqlMasterDataSource,
          MysqlSlaveDataSource mysqlSlaveDataSource
  ) {
    this.mysqlMasterDataSource = mysqlMasterDataSource;
    this.mysqlSlaveDataSource = mysqlSlaveDataSource;
  }
```

#### 建立dynamicDb
setDefaultTargetDataSource默認master datasource(@Transactional只使用default datasource)
setTargetDataSources放入master & slave datasource
```java
  @Bean("dynamicDb")
  public DynamicDataSource dynamicDb(
          @Qualifier("dataSource") DataSource masterDataSource,
          @Qualifier("dataSourceSlave") DataSource slaveDataSource
  ) {
    Map<Object, Object> targetDataSources = new HashMap<>();
    targetDataSources.put(DynamicDataSourceEnum.MASTER.getDataSourceName(), masterDataSource);
    targetDataSources.put(DynamicDataSourceEnum.SLAVE.getDataSourceName(), slaveDataSource);

    DynamicDataSource dynamicDataSource = new DynamicDataSource();
    dynamicDataSource.setDefaultTargetDataSource(masterDataSource);
    dynamicDataSource.setTargetDataSources(targetDataSources);
   
    return dynamicDataSource;
  }
```

#### JOOQ 版本
```java
@Bean
  public DSLContext dslContext() throws SQLException {
    DynamicDataSource dynamicDataSource = this.dynamicDb(this.mysqlMasterDataSource.dataSource(), this.mysqlSlaveDataSource.dataSource());
    DefaultConfiguration configuration = (DefaultConfiguration) new DefaultConfiguration()
            .set(dynamicDataSource)
            .set(SQLDialect.MYSQL);
    return DSL.using(configuration);
  }
```

#### Mybatis版本: 建立sqlSessionFactory
```java
  @Bean(SQL_SESSION_FACTORY)
  public SqlSessionFactory sqlSessionFactory() throws Exception {
    SqlSessionFactoryBean factory = new SqlSessionFactoryBean();
    DynamicDataSource dynamicDataSource = this.dynamicDb(this.mysqlMasterDataSource.dataSource(), this.mysqlSlaveDataSource.dataSource());
    factory.setDataSource(dynamicDataSource);
    
    // 這裡可以填入其他配置
    
    return factory.getObject();
  }
```

#### Mybatis版本: 建立transactionManager
SQL transaction只會使用上述dynamicDb中設置的default datasource(即masterDataSource)  
不會切換成AOP註解的DataSource
```java
  @Bean("DataSourceTransactionManager")
  public DataSourceTransactionManager transactionManager() throws SQLException {
    DynamicDataSource dynamicDataSource = this.dynamicDb(this.mysqlMasterDataSource.dataSource(), this.mysqlSlaveDataSource.dataSource());
    DataSourceTransactionManager transactionManager =
            new DataSourceTransactionManager(dynamicDataSource);
    return transactionManager;
  }
```

### DataSourceSelector.java
創建一個註解，默認使用MasterDataSource
```java
package config.datasource;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Documented
public @interface DataSourceSelector {
  DynamicDataSourceEnum value() default DynamicDataSourceEnum.MASTER;
}
```

### DataSourceContextAop.java 
建立AOP（Aspect-oriented Programming）  
@Aspect => 讓Spring boot認定為AOP  
@Order(value = 1) 將AOP層級設定為最高  
@Around => 對下@DataSourceSelector註解的方法做數據源切換  
DataSourceContextHolder.set() => 設定數據源  
pjp.proceed() => 執行method  
DataSourceContextHolder.clear() => 清除數據源

```java
package config.aspect;

import config.datasource.DataSourceContextHolder;
import config.datasource.DataSourceSelector;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

@Aspect
@Order(value = 1)
@Component
public class DataSourceContextAop {

  @Around("@annotation(config.datasource.DataSourceSelector)")
  public Object setDynamicDataSource(ProceedingJoinPoint pjp) throws Throwable {
    try {
      Method method = this.getMethod(pjp);
      DataSourceSelector dataSourceImport = method.getAnnotation(DataSourceSelector.class);
      DataSourceContextHolder.set(dataSourceImport.value().getDataSourceName());
      return pjp.proceed();
    } finally {
      DataSourceContextHolder.clear();
    }
  }
  private Method getMethod(JoinPoint pjp) {
    MethodSignature signature = (MethodSignature)pjp.getSignature();
    return signature.getMethod();
  }

} 
```

### DAO.java 
最後在DAO的SQL上加入AOP註解
```java
package dao;

import config.datasource.DataSourceSelector;
import config.datasource.DynamicDataSourceEnum;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class DAO {
  @Autowired DSLContext dslContext;
  
  // 指定 Slave DataSource
  @DataSourceSelector(value = DynamicDataSourceEnum.SLAVE)
  public Slave getSlave() {
    return dslContext
        .selectFrom("slave_table")
        .fetchInto(Slave.class);
  }
  
  // 指定 Master DataSource
  @DataSourceSelector(value = DynamicDataSourceEnum.MASTER)
  public Master getMaster() {
    return dslContext
        .selectFrom("master_table")
        .fetchInto(Master.class);
  }
  
  // 未指定，默認使用 Master DataSource
  public Default getDefault() {
    return dslContext
        .selectFrom("default_table")
        .fetchInto(Default.class);
  }
  
  // Transaction，默認使用 MasterDataSource
  @Transactional(rollbackFor = Exception.class)
  public Transaction getTransaction() {
    return dslContext
        .selectFrom("transaction_table")
        .fetchInto(Transaction.class);
  }
}
```

## Spring Boot Interface無法使用AOP
專案的SQL寫在xml，mapper到DAO的Interface  
然而Sping Boot AOP的註解在Interface不起作用

DAO Interface
```java
@Repository
@Mapper
public interface SomethingDAO {

  @DataSourceSelector(value = DynamicDataSourceEnum.SLAVE)
  Something getSomething();
}
```

SQL xml
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd" >
<mapper namespace="dao.mysql.SomethingDAO">

    <select id="getSomething" resultType="Something">
        SELECT *
        FROM something_table
    </select>

</mapper>
```

解法:
透過另一種全文搜尋的方式匹配AOP及interface中的method  
getAdvice會在getPointcut為true的時候被觸發
```java
package config.aspect;

import config.datasource.DataSourceSelector;
import org.aopalliance.aop.Advice;
import org.springframework.aop.Pointcut;
import org.springframework.aop.support.AbstractBeanFactoryPointcutAdvisor;
import org.springframework.aop.support.StaticMethodMatcherPointcut;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

@Component
public class DataSourceSelectorAdvisor extends AbstractBeanFactoryPointcutAdvisor {
  private final StaticMethodMatcherPointcut pointcut = new StaticMethodMatcherPointcut() {
    @Override
    public boolean matches(Method method, Class<?> targetClass) {
      // 直接使用spring工具包，来获取method上的注解（会找父类上的注解）
      return AnnotatedElementUtils.hasAnnotation(method, DataSourceSelector.class);
    }
  };
  private final Advice advice = new DataSourceSelectorInterceptor();

  @Override
  public Pointcut getPointcut() {
    return pointcut;
  }

  @Override
  public Advice getAdvice() {
    return advice;
  }
}
```


## 缺點
多個微服務需要重寫多次讀寫分離的配置  
每次都得寫一次Enum, AOP, 註解, 資料庫配置等多個檔案  
個人覺得小專案較適合維護

## 參考資料
### 1. Mybatis: 读写分离原来这么简单，一个小注解就够了  
https://www.51cto.com/article/650044.html

### 2. JOOQ: jooq 整合 springboot 实现多数据源
https://blog.csdn.net/yuanchengfu0910/article/details/130927354

### 3. 抽象類AbstractRoutingDataSource切換多數據源應用: Spring是如何支持多数据源的
https://juejin.cn/post/7104858276776378381

### 4. Spring Boot interface使用AOP: SpringBoot基于Interface的Annotation在AOP中如何生效
https://davyjones2010.github.io/2022-06-02-spring-annotation-on-interface/


## 補充資料
mybatis團隊有提供多數據源的套件
https://gitee.com/baomidou/dynamic-datasource-spring-boot-starter

公司的專案將SQL寫在xml，mapper到interface故不適用，如果是寫在class類的專案，可以考慮看看
