---
layout: post
title: "KambojaJS: TDD, IOC dan Dependency Injection"
tags:
- KambojaJS
---

<!--
cSpell:disable
-->


## TDD Nowadays

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">If you don’t have tests, then nothing fails when you change stuff. <a href="https://t.co/z97bfQfxry">pic.twitter.com/z97bfQfxry</a></p>&mdash; David Fowler (@davidfowl) <a href="https://twitter.com/davidfowl/status/847850949364260864">March 31, 2017</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>


## Waktu Eksekusi
Hal yang tidak kalah pentingnya dalam membuat unit testing adalah memastikan waktu eksekusi test case yang cepat. Test case yang cepat berpengaruh terhadap produktifitas pengerjaan aplikasi dan yang terpenting adalah stabilitas testing itu sendiri. Saya sangat berpengalaman dengan test case yang berjumlah lebih dari 500 test case dengan waktu eksekusi lama yang kadang-kadang test berjalan lancar di local tapi gagal setelah di push ke server CI. Sering juga ketemu test case yang gagal tanpa sebab dan berjalan lancar setelah server CI di restart beberapa kali.

Dari pengalaman-pengalaman tersebut satu hal yang paling saya garis bawahi dalam melakukan unit testing adalah mengurangi testing yang terkoneksi dengan IO (database, network, file dsb) karena waktu eksekusi paling banyak tersita saat melakukan akses ke IO dan berpengaruh terhadap stabilitas testing secara keseluruhan.

Salah satu keunggulan MVC adalah kita bisa melakukan separation concern dan dependency injection, jadi prinsipnya kita bisa memisahkan kode yang terkoneksi dengan IO dan menjadikannya sebuah komponen yang reusable, pada saat testing komponen tersebut akan sangat mudah di ganti dengan mock atau stub. Dengan trik ini jumlah unit testing yang terkoneksi dengan IO bisa di isolasi di bagian yang diperlukan saja dan bisa di buat minimum karena bersifat reusable. Misalnya kita mempunyai controller sebagai berikut:

```typescript
export class UserController extends Controller {
    detail(id:string){
        let user = await User.findById(id)
        if(!user) throw new HttpStatusError(404, "Requested user not found")
        return json(user)
    }
}
```

Kode di atas bagian yang terkoneksi dengan IO adalah `User.findById(id)` maka bagian tersebut bisa kita extract ke service layer

```typescript
export class UserService {
    getDetail(id:string){
        return User.findById(id)
    }
}
```

Kelas `UserService` diatas kemudian bisa kita pass ke constructor `UserController` sebagai berikut:

```typescript
export class UserController extends Controller {
    constructor(private service:UserService)

    detail(id:string){
        let user = await this.service.getDetail(id)
        if(!user) throw new HttpStatusError(404, "Requested user not found")
        return json(user)
    }
}
```

Dengan cara seperti itu saat melakukan testing kita bisa mem-pass stub ke konstruktor `UserController` sehingga testing akan terbebas dari koneksi IO.

```typescript
import { stub } from "kamboja-testing"

it("Should return user detail properly", () => {
    let service = stub(new UserService())
    service.MOCK.getDetail.withArgs(1).returns({ id:1, name: "John" })
    let controller = new UserController(service)
    let result = controller.detail(1)
    expect(result.body).eq({ id: 1, name: "John" })
    expect(result.type).eq("application/json")
})
```

Ada beberapa hal penting yang bisa dilihat dari unit testing di atas:

* Unit testing controller bisa terisolasi, artinya tanpa harus melakukan integration testing.
* Controller bisa di test tanpa harus terkoneksi dengan IO yang membuat waktu eksekusi menjadi cepat.

