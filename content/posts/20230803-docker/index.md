---
title: Dockerize Node
description: Node.js + Docker
date: 2022-08-03
slug: Docker
draft: true
categories:
- Docker
---

## 1. Docker build
Docker build在每個階段都會產生一個image以及一個temporary container（為了再下一階段run image）
each statement -> build a image -> build a temporary container
-> enter next statement -> build b image -> remove a temporary container
 
### Images, Container, Volumes
1. Image: read-only
2. Container: read-write, temporary
3. Volume: read-write, persistent


## Volume & Bind Mount

### 建立 ＆ 移除 volume
```text
docker build -t feedback-node:volumes . 
docker rmi feedback-node:volumes
```

### 將container綁定volume
![types-of-mounts](/img/20230803-docker/types-of-mounts.png)
```text
docker run -d --rm -p 3000:80 --name feedback-app -v feedback:/app/feedback -v "/Users/wuwenjin/Desktop/demo/learn-docker/demo-volume:/app" -v /app/node_module feedback-node:volumes
```
1. Named Volume: 由Docker管理，不會隨著Container結束而被刪除，-v feedback:/app/feedback => 將container /app/feedback綁到feedback volume
2. Bind Mount: 存放在主機檔案系統，不通過Docker管理，-v "/Users/wuwenjin/Desktop/demo/learn-docker/demo-volume:/app" => Bind mount, html等資料可以隨時更新
3. Anonymous Volume: 由Docker管理，隨著Container結束而被刪除，-v /app/node_module => 將bind mount蓋掉的node_module重新加回

## 掛載 Database
1. 使用internal address
```javascript
 mongodb://host.docker.internal:27017/course-goals
```


![docker-db](/img/20230803-docker/docker-db.png)
1. Create a network, named "favorites-net"
2. Run mongodb with "favorites-net" network
3. Build an image, named "favorites-node"
4. Run image "favorites-node" with "favorites-net" network

```text
docker network create favorites-net

docker run -d name mongodb --network favorites-net mongo

docker build -t favorites-node .

docker run --name favorites --network favorites-net -d --rm -p 3000:3000 favorites-node

```

replace mongo db url by mongodb because mongodb and favorites-app are in the same network.
```javascript

mongoose.connect(
  'mongodb://mongodb:27017/swfavorites',
  { useNewUrlParser: true },
  (err) => {
    if (err) {
      console.log(err);
    } else {
      app.listen(3000);
    }
  }
);

```


### Arguments & Environment Variables

## 2. 查看目錄結構
```text
docker exec -it <container ID> sh
```
![exec-sh](/img/20230803-docker/exec-sh.png)


## 3. Docker Cache機制
1. 指定有node runtime的kernel
2. 指定工作資料夾，避免與kernal的檔案混合
3. 只要copy的檔案有更動，docker build會選擇不用cache
避免dependency重新npm install，需要加在dockerfile
```text
// dockerfile
# 選擇node:alpine
FROM node:alpine

# 指定預設/工作資料夾
WORKDIR /usr/nestapp

# 只copy package.json檔案
COPY ./package.json ./
# 安裝dependencies
RUN npm install

# copy其餘目錄及檔案
COPY ./ ./

COPY src src
COPY test test

# 指定啟動container後執行命令
CMD ["npm", "start"]
```

## 4. Docker Compose
讓 Container 彼此溝通

```text
// docker-compose.yaml
#目前docker-compose版本是3
version: '3'
#在Services下列出內部網路相關的container
services:
    # node.js container name
    nestapp:
        restart: always
        # 可以指定Dockerfile build image
        build: .
        # 設定port mapping
        ports:
            - '8080:3000'
    # redis container name
    redis-server:
        # 指定由image建立container
        image: 'redis'

```

## 5. Local Kubernetes Playground - Minikube
Kubernetes Cluster互動 => kubectl
Context: 叢集
```text
// 取得設定檔
kubectl config view

// 切換context
kubectl config use-context minikube

// 查詢可切換的叢集
kubectl config get-contexts

// 查看目前正在管理的context
kubectl config current-context

// 取得叢集狀態
kubectl cluster-info

// 代理
kubectl proxy

// 
```

## Container in Kubernetes
1. pod
2. Service

Pod 包含一個/一組 Container

```text
kubectl apply -f nestjsapi-pod.config.yaml

kubectl apply -f nestjsapi-service.yaml

kubectl get pods/services
kubectl get all

kubectl describe pod nestjs-pod(container name)

```


```text
minikube start

minikube delete

minikube ip
```


## Kubernetes Yaml
- apiVersion: v1
- kind: 設定組件
- metadata: 組建資訊，labels（讓此組件能被其他組件選取）
- spec: 描述組件的內容

### Kind
1. Pod: set container
2. Service: set internet structure
3. Volume: container sharing-space
4. Namespace: cluter resource access  
5. 其他進階組件：Deployment, StatefulSet, ReplicaSet, DaemonSet, Job...

### Spec Type
1. ClusterIP: default，只有在Cluster裡才能看到
2. NodePort: port侷限30000~32676，能被外部以IP存取，用於開發環境
3. LoadBalancer: 能被外部以IP存取，internal or external(cloud provider)
4. ExternalName: 網址存取，需搭配kube-dns


## 架構
VM外存取pod透過kube-proxy，導到NodePort指定的Port
Node內溝通的Service Type是Cluster IP
