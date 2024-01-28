---
title: "插入排序"
description: 基本排序-Insertion Sort
date: 2024-01-28T14:02:01+08:00
slug: insertion-sorting
image: /img/sorting-cover/insertion-sort.jpg
categories:
- 演算法
---
# Insertion Sort
將資料分為兩區，前半部已排序，後半部的第一個值插入前半部適當的位置

## 原理
初始陣列： [2, 3, 4, 1, 5]

1. [2, 3, 4, 1, 5] 的 2 比較 3 => [2, 3]
2. [2, 3, 4, 1, 5] 的 2, 3 比較 4 => [2, 3, 4]
3. [2, 3, 4, 1, 5] 的 2, 3 ,4 比較 1  
   => 先把 2, 3, 4 往後移 [2, 2, 3, 4 ,5]  
   => 把 1 換到最前面 [1, 2, 3, 4, 5]


## 實現邏輯
1. 設定target = i
2. 從i+1往i~index=0找
3. 如果找到，把i移到i+1，target設為i
4. 把target的值換掉


## 插入排序法
```javascript
function insertion(arr) {
  for (let i = 1; i < arr.length; i++) {
    let currentVal = arr[i];
    let target = i;
    for (let j = i - 1; j >= 0 && arr[j] > currentVal; j--) {
      arr[j+1] = arr[j];
      target = j;
    }
    arr[target] = currentVal;
  }
  return arr;
}
```
