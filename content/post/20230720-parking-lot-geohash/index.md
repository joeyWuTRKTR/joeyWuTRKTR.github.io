---
title: 經緯度網格化 - 淺顯易懂 Geohash 編碼
description: Geohash 將經緯度變成長方形網格，字串取得相對位置。
date: 2022-07-24
slug: geohash
categories:
- 地理資訊模型
---

## 為什麼要用Geohash
將二維座標映射成一串字串，表示一個特定的長方形網格範圍  
台北101的座標("25.03463", "121.56441")，在精度8的情況下會轉換成"wsqqqm2t"  
字串越長、範圍越小、精度越高  
{{<img src="/img/20230720-parking-lot-geohash/geohash-globe.png" width="80%" height="40%">}}

**試玩看看Geohash(圖片可以點擊)：**
[![geohash-demo-tool.png](/img/20230720-parking-lot-geohash/geohash-demo-tool.png)](https://phrozen.github.io/geohash/)

### 優點
1. 資料庫索引可從經緯度簡化成一列geohash
2. geohash表示範圍，容許誤差，保護用戶隱私
3. 字串順序表示範圍層級，方便查詢附近地點

### 缺點
轉換回經緯度會有誤差，不適用高精準度的查詢

## Geohash 算法
將經緯度範圍切成一半，如果在上半部得到數字 1，在下半部得到數字 0，依此類推得到所需的二進制精度。  

**計算步驟：**  
第一步：從經度-180度到180度劃分成兩個區塊，(180,0)為上半部代表數字 1，(0,-180)為下半部代表數字 0，台北101經度的121.56441度會得到數字 1。 

第二步：由第一步確認台北101屬於(180,0)區間，接著從經度180度到0度劃分成兩個區塊，(180,90)為上半部代表數字 1，(90,-0)為下半部代表數字 0，台北101經度的121.56441度會得到數字 1。  

之後步驟：由此類推......


### 經緯度轉換二進制
**台北101經度 121.56441**  
| 經度範圍 | 劃分區間1 | 劃分區間0 | 精度 | Binary數字
| -- | -- | -- | -- | -- |
| -180 ~ 180 | 180 ~ 0 | 0 ~ 180 | 121 | 1 |
| 180 ~ 0 | 180 ~ 90 | 90 ~ 0 | 121 | 1 |
| 180 ~ 90 | 180 ~ 135 | 135 ~ 90 | 121 | 0 |
| 135 ~ 90 | 135 ~ 112.5 | 112.5 ~ 90 | 121 | 1 |
| 135 ~ 112.5 | 135 ~ 123.75 | 123.75 ~ 112.5 | 121 | 0 |
| 123.75 ~ 112.5 | 123.75 ~ 118.125 | 118.125 ~ 112.5 | 121 | 1 |
| 123.75 ~ 118.125 | 123.75 ~ 120.9375 | 120.9375 ~ 118.125 | 121 | 1 |
| 123.75 ~ 120.9375 | 123.75 ~ 122.34375 | 122.34375 ~ 120.9375 | 121 | 0 |
| 122.34375 ~ 120.9375 | 122.34375 ~ 121.640625 | 121.640625 ~ 120.9375 | 121.5 | 0 |
| 121.640625 ~ 120.9375 | 121.640625 ~ 121.2890625 | 121.2890625 ~ 120.9375 | 121.5 | 1 |

**台北101緯度 25.03463**
| 經度範圍 | 劃分區間1 | 劃分區間0 | 精度 | Binary數字
| -- | -- | -- | -- | -- |
| -90 ~ 90 | 90 ~ 0 | 0 ~ -90 | 25 | 1 |
| 90 ~ 0 | 90 ~ 45 | 45 ~ 0 | 25 | 0 |
| 45 ~ 0 | 45 ~ 22.5 | 22.5 ~ 0 | 25 | 1 |
| 45 ~ 22.5 | 45 ~ 33.75 | 33.75 ~ 22.5 | 25 | 0 |
| 33.75 ~ 22.5 | 33.75 ~ 28.125 | 28.125 ~ 22.5 | 25 | 0 |
| 28.125 ~ 22.5 | 28.125 ~ 25.3125 | 25.3125 ~ 22.5 | 25 | 0 |
| 25.3125 ~ 22.5 | 25.3125 ~ 23.90625 | 23.90625 ~ 22.5 | 25 | 1 |
| 25.3125 ~ 23.90625 | 25.3125 ~ 24.609375 | 24.609375 ~ 23.90625 | 25 | 1 |
| 25.3125 ~ 24.609375 | 25.3125 ~ 24.9609375 | 24.9609375 ~ 24.609375 | 25 | 1 |
| 25.3125 ~ 24.9609375 | 25.3125 ~ 25.13671875 | 25.13671875 ~ 24.609375 | 25 | 0 |

### 二進制數字合併
經過上方圖表的計算轉換得到：  
經度二進制： 11010 11001  
緯度二進制： 10100 01110  

**將經度交錯放置偶數位、緯度放奇數位**
![z-curve](/img/20230720-parking-lot-geohash/z-curve.png)


經緯度的二進制數字合併成 11100 11000 10110 10110
| 經度 | 緯度 | 合併值 |
| - | - | - |
| 1 | - | 1 |
| - | 1 | 11 |
| 1 | - | 111 |
| - | 0 | 1110 |
| 0 | - | 11100 |
| - | 1 | 11100 1 |
| 1 | - | 11100 11 |
| - | 0 | 11100 110 |
| 0 | - | 11100 1100 |
| - | 0 | 11100 11000 |


### 轉成十進制查詢base32字串
將二進制轉成十進制，依照base32表查詢字串  
（因容易和數字搞混，base32 去掉 a, i, l, o）
![base-32](/img/20230720-parking-lot-geohash/base32.png)  
| 二進制 | 十進制 | base32 | 二進制經度數量 | 二進制緯度數量 |
| - | - | - | - | - |
| 11100 | 28 | w | 3 | 2 |
| 11000 | 24 | s | 5 | 5 |
| 10110 | 22 | q | 8 | 7 |
| 10110 | 22 | q | 10 | 10 |


**得出台北101 geohash字串長方型網格範圍"wsqq"**
{{<img src="/img/20230720-parking-lot-geohash/geohash-p-4.png" width="50%" height="50%">}}



### Geohash長度對應面積表
| geohash長度 | 面積                    | km誤差      |
|-----------|-----------------------|-----------|
| 1         | 5,009.4km x 4,992.6km | +- 2500km |
| 2         | 1,252.3km x 624.1km   | +- 630km  |
| 3         | 156.5km x 156km       | +- 78km   |
| 4         | 39.1km x 19.5km       | +- 20km   |
| 5         | 4.9km x 4.9km         | +- 2.4km  |
| 6         | 1.2km x 609.4m        | +- 610m   |
| 7         | 152.9m x 152.4m       | +- 76m    |
| 8         | 38.2m x 19m           | +- 19m    |
通常用到geohash 5~8長度即可


## 工作上實際應用
目前我們在全球各地擁有超過一萬個停車點  
隨著運營規模擴大、車輛數的增加  
上/下班尖峰時刻、演唱會等特殊情況
高併發的API Request會使資料庫SQL無法即時算出資料，造成資料擁塞。
### 原本的解法
在PostgreSQL用車輛經緯度計算，距離所有停車點橢圓球體5公里內的最近停車點  
![map-circle.png](/img/20230720-parking-lot-geohash/map-circle.png)
（比對數萬個停車點）
```
PostgreSQL:
SELECT ST_DistanceSpheroid(pos, ST_SetSRID(ST_MakePoint(#{lon}, #{lat}), 4326), 'SPHEROID["WGS 84",6378137,298.257223563]') as distance
FROM parking_lot_table
WHERE
  ST_DistanceSpheroid(pos, ST_SetSRID(ST_MakePoint(#{lon}, #{lat}), 4326), 'SPHEROID["WGS 84",6378137,298.257223563]') < 5000 AND
  ORDER BY distance
LIMIT 1
```

### 導入Geohash後
取得車輛方圓5公里內最近的停車點  
因此面積是 5km x 5km x pi = 78平方公里  
選用層級五即可

**分析步驟：**
1. 如果層級五有找到停車點（紅色區域，5km x 5km = 25平方公里），找到停車點->query
2. 如果層級五沒有找到停車點，找同層級的其他八個區域（綠色區域），總面積達到225平方公里（25km2 x 9 = 225km2），找到停車點->query
3. 如果層級五的九宮格都沒有找到，則沒有滿足條件的停車點
   ![map-geo.png](/img/20230720-parking-lot-geohash/map-geo.png)

## 結論：
### 1. 減少查詢SQL次數
首先可以判斷是否座標周圍有涵蓋目標座標（使用者周圍是否有停車點）
### 2. 提升SQL查詢效率
第二是可以依照網格層級決定篩選多少量級的資料
藉由判斷是否在自身geohash網格、周圍八個geohash網格，將篩選出的資料範圍縮小



## 補充：Node Geohash套件
### npm - ngeohash: https://www.npmjs.com/package/ngeohash
```javascript
const geohash = require('ngeohash');

// 1. 將經緯度座標轉成Geohash
const taipei101Geohash = geohash.encode(25.03463, 121.56441)
console.log(taipei101Geohash); // wsqqqm2t2，默認層級九

// 2. 將Geohash轉成經緯度座標
const taipei101LatLon = geohash.decode(taipei101Geohash);
// Geohash轉回經緯度會有誤差
console.log(taipei101LatLon.latitude); // 25.034644603729248
console.log(taipei101LatLon.longitude); // 121.56442880630493

// 3. 找出Geohash周圍八個網格
const taipei101GeohashNeighbors = geohash.neighbors(taipei101Geohash)
console.log(taipei101GeohashNeighbors);
// wsqqqm2t2 周圍的八個geohash網格
// [
//     'wsqqqm2t8',
//     'wsqqqm2t9',
//     'wsqqqm2t3',
//     'wsqqqm2t1',
//     'wsqqqm2t0',
//     'wsqqqm2mp',
//     'wsqqqm2mr',
//     'wsqqqm2mx'
// ]
```

### 其他用法：
```javascript
const geohash = require('ngeohash');

const taipei101Geohash = geohash.encode(25.03463, 121.56441, 4)
console.log(taipei101Geohash); // wsqq, 取層級四

const taipei101GeohashNeighbors = geohash.neighbors(taipei101Geohash)
console.log(taipei101GeohashNeighbors);
// [
//   'wsqr', 'wsqx',
//   'wsqw', 'wsqt',
//   'wsqm', 'wsqj',
//   'wsqn', 'wsqp'
// ]

// 1. 找出周圍八個網格中指定位置的網格
const neighbor = geohash.neighbor(taipei101Geohash, [1,0])
console.log('neighbor = ', neighbor); // wsqr，最上面的八個網格

// 2. 找出Geohash網格周圍四個角落的經緯度
const bbox = geohash.decode_bbox('wsqq')
console.log(bbox); 
// 最小緯度、最小經度、最大緯度、最大經度
// [ 24.9609375, 121.2890625, 25.13671875, 121.640625 ]

// 3. 找出範圍內的所有geohash網格
// 切到的會算進去嗎？
const bboxes = geohash.bboxes(25.1, 121.6, 25.2, 121.7, 5)
console.log(bboxes);
// 找wsqq下層級五的geohash網格
// [
//   'wsqqz', 'wsqwb',
//   'wsqwc', 'wsqrp',
//   'wsqx0', 'wsqx1',
//   'wsqrr', 'wsqx2',
//   'wsqx3'
// ]
```
### 周圍四個角落的經緯度
![geo-decode-bbox.png](/img/20230720-parking-lot-geohash/geo-decode-bbox.png)

### 周圍的八個Geohash網格
![geo-bboxes.png](/img/20230720-parking-lot-geohash/geo-bboxes.png)



## 參考資料
### 影片:
**如何搜索附近的商家? Geohash （上）**  
https://www.youtube.com/watch?v=NCvYkJWenb8&t=745s&ab_channel=HuaHua  

**如何搜索附近的商家? Geohash （下）**  
https://www.youtube.com/watch?v=_UAkuUVzwcY&ab_channel=HuaHua

### Demo工具:
**GeoHash Demo**
https://phrozen.github.io/geohash/  

**ngeohash:**  
https://www.npmjs.com/package/ngeohash

### 文章：
**空间索引之GeoHash**  
https://blog.csdn.net/wangshuminjava/article/details/106665991
