---
title: "選擇排序法"
description: 基本排序-Selection Sort
date: 2024-01-28
slug: selection-sorting
image: /img/sorting-cover/selection-sort.jpg
categories:
- 演算法
---
# Selection Sort
選擇最小的值，跟前面的數值交換

## 原理
把陣列最小值(i+1)和第一個未換過的數值(i)交換  
第一次：[4, 3, 2, 1] 第一個未換過的數值是4，找到 [3, 2, 1] 最小值1交換  
[4, 3, 2, 1] => [1, 3, 2, 4]  
第二次：[3, 2, 4] 第一個未換過的數值是3，找到 [2, 4] 最小值2交換  
[1, 3, 2, 4] => [1, 2, 3, 4] 

## 實現邏輯
1. 把陣列第一個Index定義為target Index，遍歷一次
2. 從下一個Index開始遍歷第二次，找到最小值則將target Index換掉
3. 檢查target Index是否和第一個迴圈的初始Index相同，不同則swap index
總結：兩個for loop(i, i+1), 兩個if check(change target index, swap index)



## 選擇排序法
```javascript
function selection(arr) {
  for (let i = 0; i < arr.length; i++) {
    let lowest = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[lowest] > arr[j]) {
        lowest = j
      }
    }
    if (i !== lowest) swap(arr, i, lowest);
  }
  return arr;
}

function swap(arr, index1, index2) {
  const temp = arr[index1];
  arr[index1] = arr[index2];
  arr[index2] = temp;
}
```
