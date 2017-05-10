---
layout: post
title: "Inside KambojaJS: Strategy Pattern"
tags:
- KambojaJS
---

Salah satu tantangan yang saya alami dalam membuat [KambojaJS](http://kambojajs.com) adalah membuat sebuah framework yang fleksibel, mempertahankan logika yang sederhana dan tetap perpegangan pada prinsip Open/Close principal.

Contohnya dalam proses meng-generate controller menjadi route (URL) yang dilakukan oleh modul yang saya namakan Route Generator. Route generator mempunya spesifikasi sbb:

1. Bisa melakukan generate route dari nama namespace, nama controller, nama action dan nama parameternya
2. Bisa melakukan generate route dengan decorator. Ini adalah pilihan optional jika developer tidak menginginkan mode generator default misalnya ingin membuat custom route maka developer bisa memakai decorator `@http.get("/custom/route")`.
3. Bisa melakukan generate route dengan *by convention*. Disini maksudnya route generator akan meng-generate route sesuai dengan penamaan action yang sudah di tentukan.
4. Masing-masing generator diatas mempunyai prioritas. Nomor 2 mempunyai prioritas paling tinggi, dilanjutkan nomor 3 dan terakhir nomor 1. Jadi untuk controller/action yang sudah diisi decorator, spesifikasi 1 dan 3 tidak akan berlaku, demikian seterusnya.
5. Open system, jadi suatu saat nanti di mungkinkan untuk menambahkan logika baru tanpa harus mengubah keseluruhan kode.

## Strategy Pattern

Disini saya akan membahas [strategy pattern](https://en.wikipedia.org/wiki/Strategy_pattern) yang saya terapkan di KambojaJs dengan lebih sederhana sehingga akan lebih mudah di mengerti (untuk versi lengkap bisa di lihat [disini](https://github.com/kambojajs/kamboja/tree/master/src/route-generator/transformers)).

Ceritanya sekarang kita akan membuat route generator yang sederhana, dengan inputan metadata type reflection berupa JSON object sbb:

```javascript
{
    controller: "<nama kontroller>",
    action: "<nama action>",
    decorator: "< optional, route baru yang akan mengoverride default generator>"
}
```

Jadi spesifikasi dari route generator yang akan kita buat adalah sbb, di urut berdasarkan prioritasnya.

1. Kalau decorator ditentukan oleh developer, maka route yang dipakai adalah route yang ada di decorator.
2. Kalau nama action adalah `add` maka hasilnya adalah `POST /<controller>`, atau kalau nama action `modify` maka hasilnya adalah `PATCH /<controller>/:id`
3. Kalau semua di atas tidak terpenuhi maka defaultnya adalah `GET /<controller>/<action>`

Jadi misalnya route generator kita diberikan `{ controller: "user", action: "list" }`, proses akan dimulai dari spek 1, karena decorator tidak di tentukan maka lanjut ke spek 2, karena nama action adalah `list`, bukan `add` atau `modify` maka lanjut ke spek 3. disini metadata akan di generate menjadi `GET /user/list`

# Implementasi

Implementasi kode akan dibuat dengan JavaScript ES6 sehingga sudah mendukung class dan bisa melakukan operasi OOP.

Awalnya kita tentukan baseclass dari generator. Disini kita tentukan method helper yang akan di pakai oleh derived class.

```javascript
class StrategyBase {
    //transform(meta) should be implemented on derived
    next() {
        return { type: "next" };
    }
    exit(result) {
        return { type: "exit", result: result };
    }
}
```

`next()` digunakan jika implementasi strategy tidak mengolah meta data karena tidak sesuai dengan kriteria, jadi meta data akan di olah oleh strategy selanjutnya.

`exit()` digunakan jika implementasi strategy sudah mengolah metadata dan akan me-return hasil olahannya ke client code.

`transform(meta)` adalah method abstrak yang harus di implement di derived strategy, jadi disini di tentukan logika untuk menggenerate meta data menjadi route.

Jadi main program untuk route generator kita akan melakukan loop terhadap semua implementasi dari strategy dan memanggil fungsi `transform()` sbb:

```javascript
for (let x of strategies) {
    let result = x.transform(meta);
    if (result.type == "exit")
        return result.result;
}
```

Kode di atas memperlihatkan kita melakukan loop terhadap semua implementasi dari strategy `strategies` jika return type nya adalah `exit` maka return hasil pengolahan metadatanya. kalau tidak lakukan untuk strategy selanjutnya.

## Default Strategy

Default strategy akan mengkonversikan langsung meta data yang di berikan, sesuai dengan spesifikasi nomor 3.

```javascript
class DefaultStrategy extends StrategyBase {
    transform(meta) {
        return this.exit(`GET /${meta.controller}/${meta.action}`);
    }
}
```

Kode di atas memperlihatkan kita langsung memanggil fungsi `exit` yang di implementasikan di `StrategyBase` hasilnya adalah `{ type: "exit", result: "GET /<controller>/<action>" }` hasil tersebut akan membuat main program langsung me return property `result` dari hasil tersebut.

## Decorated Strategy

Decorated strategy akan melakukan pengecekan ke property `decorator` dari metadata

```javascript
class DecoratedStrategy extends StrategyBase {
    transform(meta) {
        if (meta.decorator) {
            return this.exit(meta.decorator);
        }
        return this.next();
    }
}
```

Kode diatas memperlihatkan kalau `decorator` ditentukan langsung return value dari decorator tersebut, kalau tidak pass ke strategy berikutnya.

## Convention Strategy

Convention strategy adalah implementasi Restful Api best practice dengan *codding convention* seperti yang di tentukan oleh spesifikasi nomor 2.

```javascript
class ConventionStrategy extends StrategyBase {
    transform(meta) {
        switch (meta.action) {
            case "add":
                return this.exit(`POST /${meta.controller}`);
            case "modify":
                return this.exit(`PATCH /${meta.controller}/:id`);
            default:
                return this.next();
        }
    }
}
```

Kode diatas memperlihatkan kita melakukan pengecekan terhadap `action` dari meta data, kalau salah satu dari `add` atau `modify` lakukan generate masing-masing sesuai spesifikasinya. kalau tidak langsung pass ke strategy selanjutnya.

## Generator

Generator adalah main class yang akan memakai semua implementasi dari strategy  diatas. 

```javascript
class Generator {
    constructor() {
        this.strategies = [
            //urutan menunjukan prioritas
            //semakin di atas prioritasnya semakin tinggi
            new DecoratedStrategy(),
            new ConventionStrategy(),
            new DefaultStrategy()
        ];
    }
    generate(meta) {
        for (let x of this.strategies) {
            let result = x.transform(meta);
            if (result.type == "exit")
                return result.result;
        }
    }
}
```

Perlu di perhatikan bahwa saat mendaftarkan implementasi strategy kita bisa menentukan prioritasnya dengan posisinya di array, semakin di atas prioritasnya akan semakin tinggi. Jadi dari kode ditas, `DecoratedStrategy` mempunyai prioritas paling tinggi dan `DefaultStrategy` mempunyai prioritas paling rendah sesuai dengan spesifikasi yang kita inginkan.

## Testing

Untuk menjalankan kode di atas, kode untuk mencoba route generator buatan kita adalah sbb:

```javascript
let generator = new Generator();
console.log(generator.generate({ controller: "user", action: "list" }));
//return GET /user/list

console.log(generator.generate({ controller: "user", action: "add" }));
//return POST /user

console.log(generator.generate({ controller: "user", action: "list", decorator: "GET /hello/world" }));
//return GET /hello/world
```

## Open/Close principal

Dari implementasi di atas kita sudah menerapkan prinsip Open/Close principal. *open for extension close for modification*. Bagaimana nantinya kalau kita ingin membuat strategy generator yang lain? jawabannya adalah dengan membuat strategy baru dan mendaftarkannya di main generator, bukan memodifikasi kode yang sudah ada.

## Akhir Kata

Dengan strategy pattern di atas bisa dilihat, pembuatan route generator yang fleksibel dan memegang prinsip open/close principal menjadi sangat mudah dan sangat jelas. Pemisahan logika program juga sangat jelas, masing-masing strategy bisa di unit test terpisah sehingga bisa meningkatkan nilai coverage unit testing. Kode lengkap dari contoh di atas bisa di lihat [disini](https://gist.github.com/ktutnik/f69e56fe9c2a0adf8b41e47d1c1af636)

