---
title: Geohash 計算點範圍的好工具
description: 这是一个副标题
date: 2020-09-10
slug: geohash
categories:
- Test
- 测试
---


## Introduce Geohash :
Geohash是一種編碼方式
將“經緯度座標”轉成由數字和英文字母所代表的“網格(Grid)”範圍

舉例來說：  
台北101的座標("25.03463", "121.56441")  
在精度8的情況下會轉換成"wsqqqm2t"
![taipei101-coordinate-google-map.png](/img/20230720-parking-lot-geohash/taipei101-coordinate-google-map.png)
#### 試玩看看Geohash(圖片可以點擊)：
Sunny在哪？
Geek在哪？
[![geohash-demo-tool.png](/img/20230720-parking-lot-geohash/geohash-demo-tool.png)](https://phrozen.github.io/geohash/)


## 越多編碼數量，範圍逐漸縮小
精度1：面積：5,009.4km x 4,992.6km
![geohash-p-1.png](/img/20230720-parking-lot-geohash/geohash-p-1.png)

精度2：面積：1,252.3km x 624.1km
![geohash-p-2.png](/img/20230720-parking-lot-geohash/geohash-p-2.png)

精度3：面積：156.5km x 156km
![geohash-p-3.png](/img/20230720-parking-lot-geohash/geohash-p-3.png)

精度4：面積：39.1km x 19.5km
![geohash-p-4.png](/img/20230720-parking-lot-geohash/geohash-p-4.png)

精度5：面積：4.9km x 4.9km
![geohash-p-5.png](/img/20230720-parking-lot-geohash/geohash-p-5.png)

精度6：面積：1.2km x 609.4m
![geohash-p-6.png](/img/20230720-parking-lot-geohash/geohash-p-6.png)

精度7：面積：152.9m x 152.4m
![geohash-p-7.png](/img/20230720-parking-lot-geohash/geohash-p-7.png)

精度8：面積：38.2m x 19m
![geohash-p-8.png](/img/20230720-parking-lot-geohash/geohash-p-8.png)

# Geohash 精度對應面積表
每個層級的解析度：
| 層級(Precision)  | 面積                   |
|-----|----------------------|
| 1   | 5,009.4km x 4,992.6km |
| 2   | 1,252.3km x 624.1km |
| 3   | 156.5km x 156km |
| 4   | 39.1km x 19.5km |
| 5   | 4.9km x 4.9km |
| 6   | 1.2km x 609.4m |
| 7   | 152.9m x 152.4m |
| 8   | 38.2m x 19m |
| 9   | 4.8m x 4.8m |
| 10  | 1.2m x 59.5cm |
| 11  | 14.9cm x 14.9cm |
| 12  | 3.7cm x 1.9cm |


# 計算原理

# Node Geohash套件 
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

![geo-decode-bbox.png](/img/20230720-parking-lot-geohash/geo-decode-bbox.png)
周圍四個角落的經緯度

![geo-bboxes.png](/img/20230720-parking-lot-geohash/geo-bboxes.png)
周圍的八個Geohash網格


# 工作上實際應用
目前我們在全球各地擁有超過一萬個停車點
在非尖峰時刻資料庫的可以好好消化每一個Request
然而像上/下班的每日尖峰、演唱會等特殊情況，會有一堆人在同時尋找哪裡可以停車
這時候會高達每秒幾十/百個Request進來，Postgres無法即時算出資料，造成資料擁塞等待計算完回傳結果。
### 原本的解法：
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

### 導入Geohash後：
業務場景為取得車輛方圓5公里內最近的停車點，因此面積是 5km x 5km x pi = 78平方公里  
因此選用層級五即可
1. 如果層級五有找到停車點（紅色區域，5km x 5km = 25平方公里），找到停車點->query
2. 如果層級五沒有找到停車點，找同層級的其他八個區域（綠色區域），總面積達到225平方公里（25km2 x 9 = 225km2），找到停車點->query
3. 如果層級五的九宮格都沒有找到，則沒有滿足條件的停車點
   ![map-geo.png](/img/20230720-parking-lot-geohash/map-geo.png)

# 結論：
## 1. 減少查詢SQL次數
首先可以判斷是否座標周圍有涵蓋目標座標（使用者周圍是否有停車點）
## 2. 提升SQL查詢效率
第二是可以依照網格層級決定篩選多少量級的資料
藉由判斷是否在自身geohash網格、周圍八個geohash網格，將篩選出的資料範圍縮小
