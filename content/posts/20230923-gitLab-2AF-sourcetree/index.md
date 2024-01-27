---
title: "Sourcetree ssh連線遠端gitLab"
date: 2023-09-23T14:00:04+08:00
slug: gitLab-2AF-sourcetree-rsa
image: /img/20230914-database-read-write-splitting/cover.jpg
draft: true
categories:
- Database
- Mybatis
- JOOQ
- Java
---
GitLab等大型程式碼儲存庫設定2AF後  
除了帳號密碼/access token登入之外，還需使用手機驗證    
因此Sourcetree需要改成使用SSH連線登入


## Terminal確認.ssh檔案裡是否有id_rsa檔案
```text
ls ~/.ssh
```
私鑰公鑰是一對的
id_rsa => 私鑰（不能外流）
id_rsa.pub => 公鑰
![ssh.png](img/20230923-gitLab-2AF-sourcetree/ssh.png)


## 用id_rsa.pub產生一組rsa key
```text
cat ~/.ssh/id_rsa.pub
```

產生出的rsa key如下（範例）
ssh-rsa開頭，自己的email結尾
```text
ssh-rsa  
AAB3NzaC1yc2EAAAABIwAAAIEA9xjGJ+8DLrxSQfVxXYUx4lc9copCG4HwD3TLO5i  
fezBQx0e9UnIWNFi4Xan3S8mYd6L+TfCJkVZ+YplLAe367/vhc1nDzfNRPJ95YnATefj  
YEa48lElu7uq1uofM+sZ/b0p7fIWvIRRbuEDWHHUmneoX8U/ptKFZzRpb/  
vTE6nE= root@ps0701
```

## gitLab透過個人rsa key建立SSH keys 
1. 點選gitLab右上角profile
2. 點選preferences
3. 點選SSH Keys
4. 將整段rsa key填入並填寫其他資訊  

![gitlab-ssh-keys.png](img/20230923-gitLab-2AF-sourcetree/gitlab-ssh-keys.png)




## 什麼是rsa?
非對稱加密法，公鑰的解密需要一把密鑰
原理是質因數分解法
RSA由Rivest, Shamir和Adleman三個人的名字縮寫
密鑰交換
數位簽章

因密鑰長度較長，不適合大量資料運輸

配合雜湊演算法執行數位簽章







