---
title: "泡沫排序法"
description: 基本排序-Bubble Sort
date: 2024-01-27T16:42:33+08:00
slug: bubble-sorting
image: /img/sorting-cover/bubble-sort.jpg
categories:
- 演算法
---
# Bubble Sort(Sinking Sort)
兩兩比較，把最大的數字往數組的最後排

## 1. 兩兩比較，把最大的數字往數組的最後排
origin: [30, 12, 45, 15, 3]  
first 45: [30, 12, 15, 3, 45]  
second 30: [12, 15, 3, 30, 45]  
third 15: [12, 3, 15, 30, 45]  
forth 12: [3, 12, 15, 30, 45]  
fifth 3: [3, 12, 15, 30, 45]  

{{<img src="/img/20240127-algorithm-sorting-bubble/bubble-sort-origin.png" width="200px" height="50%">}}
{{<img src="/img/20240127-algorithm-sorting-bubble/bubble-sort-origin1.png" width="200px" height="50%">}}
{{<img src="/img/20240127-algorithm-sorting-bubble/bubble-sort-origin-final.png" width="200px" height="50%">}}

## 2. 只要有一輪沒有交換，代表已經排序完成
### 定義noSwap做紀錄
forth 12: [3, 12, 15, 30, 45] => noSwap = true  
fifth 3: [3, 12, 15, 30, 45]

```javascript
function bubble(arr) {
  for (let i = arr.length; i > 0; i--) {
    let noSwap = true;
    // 1. last one is already sorted at each time.
    for(let j = 0; j < i - 1; j++) {
      console.log(arr, arr[j], arr[j+1])
      if (arr[j] > arr[j+1]) {
          swap(arr, j, j+1);
          noSwap = false;
      }
    }
    
    // 2. if no swap, the sorting is done.
    if (noSwap) {
      break;
    }
  }
  return arr;
}

function swap(arr, index1, index2) {
  const temp = arr[index1];
  arr[index1] = arr[index2];
  arr[index2] = temp;
}
```

## 時間複雜度
### Best case: log(n)  
### Worst case: log(n square)
```javascript
origin array: [ 5, 4, 1, 2, 3 ]

1 round
[ 5, 4, 1, 2, 3 ] 5 4
[ 4, 5, 1, 2, 3 ] 5 1
[ 4, 1, 5, 2, 3 ] 5 2
[ 4, 1, 2, 5, 3 ] 5 3
after swap: 4,1,2,3,5

2 round
[ 4, 1, 2, 3, 5 ] 4 1
[ 1, 4, 2, 3, 5 ] 4 2
[ 1, 2, 4, 3, 5 ] 4 3
after swap: 1,2,3,4,5

3 round
[ 1, 2, 3, 4, 5 ] 1 2
[ 1, 2, 3, 4, 5 ] 2 3
result: [1,2,3,4,5]
```
