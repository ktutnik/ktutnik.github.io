---
layout: post
title: Harta Tersembunyi di Google Play API
tags:
- java
- android
---

Bekerja dengan fungsi asynchronous bukanlah hal yang mudah di native android. 
Untuk proses bisnis yang rumit jumlah callback untuk setiap operasi asynchronous bisa membentuk 
piramida yang menghabiskan batas kanan layar :).

Banyak yang tidak tahu, Google Play API memiliki sebuah library yang sangat bagus untuk menangani 
operasi asynchronous, tetapi sangat minim dokumentasi.

[Android Tasks](https://goo.gl/4fJWb1) memungkinkan aplikasi native android melakukan operasi asynchronous 
dengan kode yang lebih gampang di baca. Seperti halnya TPL di C#, meskipun tidak di support
dengan keyword `async await` oleh bahasa java. 

Await
------------------------
Langsung lompat ke hal yang paling penting yaitu fungsi `await`. Sesuai namanya thread yang dipakai untuk 
menjalankan operasi akan di blok sampai method bersangkutan selesai melakukan pekerjaannya. 

Misalnya kita punya kode dengan return type Task<String>

```java
Task<String> getUserNameAsync();
```

Kalau tanpa fungsi await maka kita harus menambahkan callback saat method selesai di eksekusi

```java
getUserNameAsync().addOnSuccessListener(new OnSuccessListener<String>(){
    @Override
    public void onSuccess(String result){
        //lakukan operasi selanjutnya
        Log.d(TAG, "Continue other tasks");
    }
});
```

Dengan fungsi await semua kelihatan lebih mudah

```java
String result = Tasks.await(getUserNameAsync());
//lakukan operasi selanjutnya
Log.d(TAG, "Continue other tasks");
```

bisa dilihat dengan fungsi await kode 'kelihatan' berjalan seperti synchronous, 
dan lebih mudah dibaca.


Konversi non Task ke Task
------------------------
Ok, sekarang kita sudah tau kehebatan library Tasks, bagaimana kalau kita mempunyai 
fungsi asynchronous dari third party? gampang!

misalnnya kita memakai library REST Client Retrofit dengan return type [Call<T>](https://goo.gl/gGvVFD) 

```java
Call<String> getUserNameAsync();
```

Untuk mengubahnya menjadi task kita lakukan dengan `TaskCompletionSource<TResult>`

```java
TaskCompletionSource<String> completionSource = new TaskCompletionSource<>();
getUserNameAsync().enqueue(new Callback<String>(){
    @Override
    public void onResponse(Response<String> response){
        if(response.isSuccess()){
            completionSource.setResult(response.body());
        }
    }
    
    @Override
    public void onFailure(Throwable t) {
        completionSource.setException(t);
    }
});
Task<String> resultTask = completionSource.getTask();
```

Menjalankan di thread berbeda
------------------------
Perlu diperhatikan, fungsi await tidak bisa dijalan di main thread (UI thread) jadi perlu penanganan 
lebih lanjut kalau kita ingin melakukan pengolahan data lebih lanjut.

Misalnya kita mempunyai proses untuk melakukan upload image, dan menyimpan url image ke database. 

```java
//return type adalah URL dari gambar
Task<String> uploadImage(Bitmap image);
Task<Void> saveUrlToDatabaseAsync(String url);
```

kedua method itu harus dipanggil bergiliran dengan bantuan fungsi await. maka proses tidak bisa 
dijalankan di main tread. Untuk melakukan hal ini kita bisa memakai fungsi `call` dan memindahkan 
proses eksekusi ke thread pool

```java
Tasks.call(Executors.newCachedThreadPool(), new Callable<Void>() {
    @Override
    public Void call() throws Exception {
        String url = Tasks.await(uploadImage(/*bitmap*/));
        Task.await(saveUrlToDatabaseAsync(url));
    }
})
```

parameter pertama dari fungsi call adalah `Executor` yang akan mengeksekusi operasi sesuai dengan 
konfigurasi yang kita inginkan. Untuk executor bisal dilihat lebih detail [disini](https://goo.gl/GGYKdY)

Akhir kata
------------------------
Semoga blog ini berguna untuk native programmer yang galau dan kehilangan arah bagaikan butiran debu :)