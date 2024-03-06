---
title: "Array From"
description: 陣列From的基本用法
date: 2024-02-18T13:19:47+08:00
slug: array-from
image: /img/javaScript-cover/array-from.jpg
categories:
- JavaScript
---

## from method解決什麼問題？
### ArrayLike & 可迭代物件Symbol.iterator 轉換成陣列   
同時map成想要的資料格式(optional)
相等 Array.from().map()
```javaScript
// Array.from(arrayLike)
Array.from('foo'); // ['f', 'o', 'o']


// Array.from(arrayLike, mapFn(element, index))
// 相等 Array.from().map()
Array.from([1, 2, 3], (x) => x + x) // [2, 4, 6]
Array.from([1, 2, 3]).map((x) => x + x);


const someNumbers = { '0': 10, '1': 15, length: 2 };
Array.from(someNumbers, value => value * 2); // => [20, 30]

// 轉換 Set
const set = new Set(["foo", "bar", "baz", "foo"]);
Array.from(set); // ['foo', 'bar', 'baz']

// 轉換 Map
const map = new Map([
  [1, 2],
  [2, 4],
  [4, 8],
]);
Array.from(map);
// [[1, 2], [2, 4], [4, 8]]

const mapper = new Map([
  ["1", "a"],
  ["2", "b"],
]);
Array.from(mapper.values());
// ['a', 'b'];

Array.from(mapper.keys());
// ['1', '2'];
```

### 生成陣列（給定長度）
```JavaScript
// 生成一个数字序列。因为数组在每个位置都使用 `undefined` 初始化，下面的 `_` 值将是 `undefined`
function range(end) {
    return Array.from({ length: end }, (_, index) => index);
}

range(4); // [0, 1, 2, 3]

// 生成一個包含十個空陣列的陣列
// [Array(0), Array(0), Array(0)]
Array.from({length: 3}, () => []);

// 與Array.fill差異
// Array.from的mapFn會返回新的Object
// Array.fill指向相同的ref
const arrObj1 = Array.from({length: 2}, () => ({}));
const arrObj2 = Array(2).fill({});

arrObj1[0] === arrObj1[1]; // false
arrObj2[0] === arrObj2[0]; // true

```

### Array.from的mapFn和Array.map差異
```JavaScript
// 透過Array和map生成數字0的陣列，會變成undefined
Array(3).map(() => 0); // [undefined, undefined, undefined]
// 但是一般陣列的map不會
[1, 2, 3].map(() => 0); // [0, 0, 0]

// Array.from的mapFn也不會
Array.from({length: 3}, () => 0);

```

### 去掉重複的數字
```JavaScript
const array = [1, 1];

const aSet = new Set(array);

console.log(Array.from(aSet));

console.log([...aSet]);
```

文章參考：  
1. mdn:   
https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/from  
2. 稀土掘金(Array.from() 五个超好用的用途):   
https://juejin.cn/post/6844903926823649293
