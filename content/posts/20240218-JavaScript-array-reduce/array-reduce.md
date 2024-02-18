---
title: "Array Reduce"
description: 陣列Reduce的三種用法
date: 2024-02-17T20:52:39+08:00
slug: array-reduce
image: /img/javaScript-cover/array-reduce.jpg
categories:
- JavaScript
---

## 基本用法: 初始值＋累加器＋當前值

```JavaScript
const array = [1, 2, 3, 4];

// 初始值給0
array.reduce((acc, val, idx, arr) => {
    console.log(`acc ${acc}, val ${val}, idx ${idx}, arr ${arr}`)
    return acc + val;
}, 0)


// acc 0, val 1, idx 0, arr 1,2,3,4
// acc 1, val 2, idx 1, arr 1,2,3,4
// acc 3, val 3, idx 2, arr 1,2,3,4
// acc 6, val 4, idx 3, arr 1,2,3,4
// return 10
```

## Reduce用途
### 累加陣列元素
```JavaScript
const array = [1, 2, 3, 4];

array.reduce((acc, val, idx, arr) => {
    return acc + val;
}, 0)
```

### 扁平陣列
```JavaScript
const array = [1, [2, 3], 4];

array.reduce((acc, val, idx, arr) => {
    return acc.concat(val);
}, [])
```

### 統計特定種類的數值(React Redcuer)
```JavaScript
const array = [
    {
        type: 'lunch',
        price: 250
    },
    {
        type: 'lunch',
        price: 100
    },
    {
        type: 'dinner',
        price: 500
    },
    {
        type: 'lunch',
        price: 1000
    },
];

// 1350
array.reduce((acc, val, idx, arr) => {
    if (val.type === 'lunch') return acc + val.price
    return acc;
}, 0)
```



## 注意初始值
### 沒有初始值，reducer會拿陣列第一個數字當初始值，從index=1開始遍歷
```JavaScript
const array = [1, 2, 3, 4];

array.reduce((acc, val, idx, arr) => {
    console.log(`acc ${acc}, val ${val}, idx ${idx}, arr ${arr}`)
    return acc + val;
})

// acc 1, val 2, idx 1, arr 1,2,3,4
// acc 3, val 3, idx 2, arr 1,2,3,4
// acc 6, val 4, idx 3, arr 1,2,3,4
// return 10
```

### 如果陣列包含非數字的元素，可能出錯
```JavaScript
function reducer (arr1) {
    return arr1.reduce((acc, val, idx, arr) => {
            console.log(`acc ${acc}, val ${val}, idx ${idx}, arr ${arr}`)
            return acc + val;
        })
}

const array1 = ['123', 2, 3, 4];
reducer(array1); // '123234'

const array2 = [{}, 2, 3, 4];
reducer(array2); // '[object Object]234'

const array3 = [[], 2, 3, 4];
reducer(array3); // '234'

const array4 = [1, [2, 3], 4];
array4.reduce((acc, val, idx, arr) => {
    return acc.concat(val);
}) // TypeError: acc.concat is not a function

```

## 有問題情況
### 空陣列
```JavaScript
const array = [];

// TypeError: Reduce of empty array with no initial value
array.reduce((acc, val, idex, arr) => {
    console.log(`acc ${acc}, val ${val}, idex ${idex}, arr ${arr}`)
    return acc + val;
})
```

### 陣列裡包含undefined
```JavaScript
onst array = [1, undefined];

// NaN
array.reduce((acc, val, idex, arr) => {
    console.log(`acc ${acc}, val ${val}, idex ${idex}, arr ${arr}`)
    return acc + val;
})
```