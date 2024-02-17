---
title: "陣列展開"
description: 陣列展開的三種方式
date: 2024-02-17T20:52:39+08:00
slug: array-flat
image: /img/javaScript-cover/array-flat.jpg
categories:
- JavaScript
---

# Array flatten有三種方式：
## 1. 使用Array內建方法flat()，括弧內可加想要展開的“層數”
```javaScript

// 展開一層
[1, 2, [3, 4, [5, 6]], 7, 8].flat() // [1, 2, 3, 4, [5, 6], 7, 8] 默認為1 flat()和flat(1)一樣

// 展開兩層
[1, 2, [3, 4, [5, 6]], 7, 8].flat(2) // [1, 2, 3, 4, 5, 6, 7, 8]

// 全部展開
[1, 2, [3, 4, [5, 6]], 7, 8].flat(Infinity) // [1, 2, 3, 4, 5, 6, 7, 8]

```

## 2. 搭配reducer&concate展開
```javaScript
function flattenArray(arr) {
  return arr.reduce((acc, val) => {
    if (Array.isArray(val)) {
      const flatArray = flattenArray(val);
      return acc.concat(flatArray);
    } else {
      return acc.concat(val);
    }
  }, [])
}

flattenArray([1, 2, [3, 4, [5, 6]], 7, 8]);

```

## 3. spread operator(只有Array內只有一層的情況)
```javaScript
 [].concat(...[1, 2, [3, 4, 5, 6], 7, 8])
```