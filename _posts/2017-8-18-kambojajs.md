---
layout: post
title: "KambojaJS: Kenapa harus membuat framework baru?"
tags:
- KambojaJS
---

<!--
cSpell:disable
-->

Saya adalah fans berat dari framework [Express](https://expressjs.com/), API nya yang minimalis dan sifatnya yang unopinionated sangat memberikan kebebasan dalam implementasi kode yang kita buat dan waktu pembelajaran (learning curve) yang cukup singkat untuk memahamimya. Menurut saya hanya ada satu kesalahan yang dibuat saat dibuatnya Express saat itu karena Express dilahirkan terlalu dini, saat engine V8 belum mendukung tools modern seperti `async/await`, pemakaian `class` dan support dari sisi bahasa pemrograman untuk mendukung `decorator`, sehingga dibalik semua kehebatan dan success story yang telah dibuat, Express menjadi framework yang kuno dan kurang mendukung development environment modern.

Sebelumnya saya sangat aware dengan framework lain yang lebih modern seperti [Koa](http://koajs.com/), yang memang di lahirkan untuk menggantikan Express, Koa di desain sepenunya untuk mendukung `async/await` secara out of the box. Tapi saya mempunyai opini subjektif tersendiri tentang Sinatra style framework (Express, Koa) dibandingkan MVC style framework, dimana `Controller` di MVC adalah class yang berdiri sendiri yang bisa di unit test secara terpisah, yang kalau di perlakukan dengan benar bisa membuat unit testing bebas dari mock/stub, bahkan bisa membuat unit testing yang terbebas dari koneksi IO (database, file statis, koneksi network dsb). Hal ini membuat project yang mempunyai ribuan unit testing akan tetap stabil dan mempunyai eksekusi waktu yang singkat. Anda bisa melihat link [StackOverflow berikut untuk mengetahui apa yang di maksud dengan unit testing yang tidak stabil dan mempunyai waktu eksekusi lama](https://stackoverflow.com/questions/368622/how-to-deal-with-long-running-unit-tests).

## KambojaJS
[KambojaJS](http://kambojajs.com) lahir dari masalah-masalah tersebut diatas, tujuannya untuk memberikan "pakaian" yang modern untuk lingkungan terbaru dari JavaScript/NodeJS untuk mendukung syntax yang modern lebih simpel dan elegan. 

Untuk anda yang belum pernah mendengar apa itu KambojaJS, KambojaJS adalah MVC framework untuk server side NodeJS. KambojaJS memakai Express untuk core functionalities nya, API application nya dibikin mirip seperti Express untuk mempersingkat learning curve untuk programmer yang sudah terbiasa memakai Express.

Tulisan ini bersifat subjective dari kaca mata saya pribadi, tujuannya untuk menunjukkan masalah-masalah yang saya hadapi saat memakai Express dan beberapa framework lain yang sengaja saya tidak sebutkan dan bagaimana saya menuangkan pemecahan masalah tersebut di KambojaJS.

## Route yang di Generate Otomatis
Kalau anda suka melakukan meta programming, anda mungkin akan merasakan keterbatasan fasilitas RTTI (Run Time Type Information) di JavaScript. Hal ini lah yang membuat hampir semua MVC framework yang ada di NodeJS tidak bisa meng-generate route dari formasi controller dan action, tapi diperlukan konfigurasi tambahan untuk menghubungkan antara route dan controller. KambojaJS bisa melakuakan hal tersebut dengan mudah dan tanpa melakukan konfigurasi tambahan, contohnya seperti potongan kode berikut:

```typescript
import { Controller } from "kamboja"

export namespace PartnerShip {
    export class UserController extends Controller {
        detail(id:string){
            //implementasi
        }

        list(offset:number, limit = 50){
            //implementasi
        }
    }
}
```

Kode di atas adalah controller standar dari KambojaJS, kode tersebut secara otomatis akan di generate menjadi 2 routes sebagai berikut:

```
GET /partnership/user/detail?id=<id>
GET /partnership/user/list?offset=1&limit=<optional>
``` 

Keuntungan dari action yang di generate secara otomatis adalah kita bisa melakukan convention over configuration artinya kita tidak perlu melakukan konfigurasi tapi cukup melakukan pemrograman dengan konvensional tertentu, seperti contoh controller diatas penamaan controller dan action secara otomatis akan membentuk konfigurasi dari route.

> Resep di balik kemampuan KambojaJS dalam meng-generate route secara otomatis adalah dengan adanya dukungan dari library [Kecubung](https://github.com/kambojajs/kamboja/tree/master/packages/kecubung). Kecubung adalah JavaScript Syntax Transformer, input dari Kecubung adalah syntax JavaScript dari file ".js" yang khusus di genreate dari bahasa TypeScript, outputnya adalah informasi tipe data dalam bentuk JSON object. Prinsip kerja Kecubung hampir mirip dengan prinsip kerja compiler, kalo compiler pada umumnya adalah melakukan transformasi dari syntax bahasa tingkat tinggi kemudian di ubah ke AST (Abstract Syntax Tree) dan outputnya bahasa tingkat menengah atau tingkat bawah demikian juga hal nya Kecubung hanya output akhirnya saja yang berbeda.

## Mendukung Async/Await Out of The Box
Sebenarnya `async/await` dan Express bisa bekerja sama dengan baik, kita bisa menggunakan ES7 atau menggunakan TypeScript untuk menggabungkan Express dan `async/await` seperti contoh berikut:

```typescript
app.use("/user/:id", async (req, res, next) => {
    let result = await User.findById(req.query.id);
    res.json(result)
})
```

Semua berjalan lancar dan baik-baik saja, sampai saatnya kita membuat middleware untuk melakukan global loging waktu yang di butuhkan untuk setiap request seperti pertanyaan di StackOverflow [disini](https://stackoverflow.com/questions/18538537/time-requests-in-nodejs-express). Sebenarnya ini adalah masalah yang sangat sederhana tapi pemecahan masalahnya menjadi sangat sulit karena Express tidak mendukung `async/await` secara out of the box. Permasalahannya adalah kita bisa tahu kapan request di mulai, tapi sangat sulit untuk tau kapan request selesai.

KambojaJS mendukung `async/await` secara out of the box, contoh untuk pemecahan kasus di atas bisa di selesaikan dengan cara "seperti" synchronous.

```typescript
import { Middleware, Core } from "kamboja"

export class RequestTime extends Middleware {
    async execute(context, next: Core.Invocation) {
        console.time("Execution Time")
        let result = await next.proceed()
        console.timeEnd("Execution Time")
        return result
    }
}
```


> Sebagian programmer mungkin lebih suka dengan callback-style middlewarenya express karena simple dan tidak perlu membuat class. Sebenarnya memakai class mempunyai keunggulan untuk skala yang lebih besar seperti bisa dipakai untuk [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection). Untuk kedepannya KambojaJS [akan segera mendukung](https://github.com/kambojajs/kamboja/issues/115) callback-style middleware dan tetap mendukung `async/await` secara out of the box.

Dari kode di atas bisa dilihat fungsi `next.proceed()` akan mengeksekusi controler dari request yang bersangkutan, sama halnya dengan fungsi `next` di middlewarenya express. Bedanya dengan KambojaJS kita mempunyai kontrol penuh terhadap eksekusi controller, kita bisa tau kapan eksekusi di mulai dan kapan eksekusi selesai. Sehingga untuk melakukan hal-hal sederhana seperti melakukan cache request atau melakukan penangkapan error secara global kemudian memberikan response beruba JSON sangat mudah dilakukan seperti contoh berikut:

```typescript
import { Middleware, Core, json } from "kamboja"

export class ErrorHandler extends Middleware {
    async execute(context, next: Core.Invocation) {
        try {
            return await next.proceed()
        }
        catch(e){
            return json(e.message, e.status || 500)
        }
    }
}
```

Kode di atas sangat jelas, kita melakukan try catch untuk semua eksekusi controller yang bermasalah. Jadi jika di dalam controller yang kita buat terjadi error yang tidak di handle maka secara otomatis akan di handle oleh middleware di atas.

Dengan cara di atas juga kita bisa dengan pede melakukan throw error dari dalam controller karena sudah ada yang akan menghandle seperti kode berikut:

```typescript
import { Controller, HttpStatusError, json } from "kamboja"

export namespace PartnerShip {
    export class UserController extends Controller {
        async detail(id:string){
            let user = User.findById(id)
            if(!user) throw new HttpStatusError(404, "Requested user not found")
            return json(user)
        }
    }
}
```

Kode di atas kita melakukan throw `HttpStatusError` jika user yang di minta tidak ada, error di atas akan secara otomatis di ubah menjadi response dengan status 404 oleh middleware  `ErrorHandler` yang kita buat sebelumnya. 


## Fleksibel dan Unopinonated


## Unit Testing, MVC dan Dependency Injection
Express memiliki cara untuk melakukan unit testing dengan memakai http server dan agent, dengan library yang biasa kita dengar [SuperTest](https://github.com/visionmedia/supertest), cara ini cukup simpel karena kita bisa membuat simulasi request dan melakukan assert untuk kondisi tertentu sesuai test case yang kita perlukan seperti contoh berikut:

```javascript
beforeEach(async () => {
    //clear all user
    await User.remove({})
})

it("Should return user properly", async () => {
    //create new user for test
    await new User({ id: 1, name: "John" }).save()

    await supertest(app)
        .get("/user/1")
        .expect(200)
})
```

Unit testing seperti di atas sangat lazim di temukan kalau anda memakai Express atau Koa, 



Unit testing yang mudah memerlukan kode dengan input dan output yang jelas.

## Analisis Statis

## Real Time