/*jshint esversion: 6 */

const express = require("express");
const app = express();
const util = require("util");
const multer = require('multer');
const mongoose = require("mongoose");
const crypto = require('crypto');



const algorithm = 'aes-256-ctr';
const ENCRYPTION_KEY = Buffer.from('ZbCKvdLslVuB4y3EZlKate7XGottHski1LmyqJHvUhs=', 'base64');
const IV_LENGTH = 16;

var _ = require('lodash');
var path = require('path');

let ejs = require('ejs');

var fs = require('fs');

mongoose.set('useFindAndModify', false);




app.set('view engine', 'ejs');




var bodyParser = require("body-parser");
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use("/css", express.static(__dirname + "/css"));
app.use(express.static("public"));


app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect('mongodb://localhost:27017/myappProject', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

var arr = [];


function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}


function decrypt(text) {
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}



var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage
});




const userSchema = new mongoose.Schema({
  id: String,
  password: String
});

const User = mongoose.model("User", userSchema);



var dosyalarSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  }

});

const klasoriciKlasorSchema = new mongoose.Schema({
  name: String,
  ustKlasoru: String,
  kullanicisi: String,
  items: [dosyalarSchema]
});

var klasorlerSchema = new mongoose.Schema({

  klasorHangiKullanicida: String,
  klasorunAdi: String,
  items: [dosyalarSchema]

});

var Item = mongoose.model("Item", dosyalarSchema);
var File = mongoose.model("File", klasorlerSchema);
var Dossier = mongoose.model("Dossier", klasoriciKlasorSchema);


const dosyaAdiDeneme1 = new Item({
  name: "osman_odev.pdf"
});
const dosyaAdiDeneme2 = new Item({
  name: "elektronik_lab_notlarim.txt"
});
const dosyaAdiDeneme3 = new Item({
  name: "blackdesert32.exe"
});




const listSchema = new mongoose.Schema({
  name: String,
  items: [dosyalarSchema]
});

var List = mongoose.model("List", listSchema);




var fileNames = ["osman_odev.pdf", "elektronik_lab_notlarim.txt", "blackdesert32.exe"];




var deleteFolderRecursive = function(path) {  //klasörü silme fonksiyonu
if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file) {
      var curPath = path + "/" + file;
        if(fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursive(curPath);
        } else { // delete file
            fs.unlinkSync(curPath);
        }
    });
    fs.rmdirSync(path);
  }
};


app.get("/kisiyeOzelSayfa", function(req, res) {
  res.render("index", {
    fileListesi: fileNames
  });
});

app.get("/", function(req, res) {

  var dir = './uploads';

  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  res.render("hosgeldiniz.ejs");
});

app.get("/kaydol", function(req, res) {
  res.render("signin.ejs");
});


app.get("/login", function(req, res) {

  res.render("login.ejs");

});

app.get("/favicon.ico", function(req, res) {
  res.sendStatus(204);
});
app.get("/undefined", function(req, res) {
  res.sendStatus(204);
});

app.get("/denemetasarim", function(req,res){
  res.render("deneme");
});




app.get('/download', function(req, res) {
  const file = `${__dirname}/uploads/RiotClientServices.exe`;
  res.download(file); // Set disposition and send it.
});


app.get("/:kullaniciAdi/items/:item/:id", function(req,res){
  //console.log(req.params);
  let kullanici = req.params.kullaniciAdi;
  let id = req.params.id;
  let item = req.params.item;
  let size, birthTime;


    fs.stat('./uploads/'+kullanici+"/"+item, (err, stats) => {
      if (err) {
          console.log(`File doesn't exist.`);
      } else {
          //console.log(stats);
          size = stats.size;
          birthTime = stats.birthtime;
          //console.log(size+"/"+birthTime);
          return 0 ;
      }
  });



  setTimeout(function(){res.render("items.ejs",{kullaniciAdi:kullanici, item:item, boyut:size, zaman:birthTime});  }, 800);

});

app.get("/:userName/items/:folderName/:item/:id", function(req,res){

  console.log(req.params);
  let userName = req.params.userName;
  let folderName = req.params.folderName;
  let item = req.params.item;
  let id = req.params.id;
  let size, birthTime;


  fs.stat('./uploads/'+userName+"/"+folderName+"/"+item, (err, stats) => {
    if (err) {
        console.log(`File doesn't exist.`);
    } else {
        //console.log(stats);
        size = stats.size;
        birthTime = stats.birthtime;
        //console.log(size+"/"+birthTime);
        return 0 ;
    }
});

setTimeout(function(){res.render("itemsKlasor.ejs",{kullaniciAdi:userName, folderName:folderName, item:item, boyut:size, zaman:birthTime});  }, 800);

});

app.get("/:userName/items/:upperFolder/:folder/:item/:id", function(req,res){
  console.log(req.params);
  let userName = req.params.userName;
  let folderName = req.params.folder;
  let upperFolder = req.params.upperFolder;
  let item = req.params.item;
  let id = req.params.id;
  let size, birthTime;


  fs.stat('./uploads/'+userName+"/"+upperFolder+"/"+folderName+"/"+item, (err, stats) => {
    if (err) {
        console.log(`File doesn't exist.`);
    } else {
        //console.log(stats);
        size = stats.size;
        birthTime = stats.birthtime;
        console.log("size:"+size+"birthtime:"+birthTime);
        //console.log(size+"/"+birthTime);
        return 0 ;
    }
});

  setTimeout(function(){res.render("itemsKlasoriciKlasor.ejs",{kullaniciAdi:userName, folderName:folderName, upperFolder:upperFolder,item:item, boyut:size, zaman:birthTime}); }, 800);
});



app.get("/:sayfaAdi", function(req, res) {

  //console.log(req.params);
  //res.send(req.params.sayfaAdi + " sayfası");
  console.log(req.body.sayfaAdi);

  let sayfaAdi = _.startCase(_.toLower(req.params.sayfaAdi));
  sayfaAdi = sayfaAdi.replace(/\s+/g, '');

  console.log("sayfa adi: ");
  console.log(sayfaAdi);

  let dir = "./uploads/"+sayfaAdi;
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
  //console.log(req.params.sayfaAdi);


  // var dir = "uploads/" + sayfaAdi;
  //
  // if (!fs.existsSync(dir)){
  //     fs.mkdirSync(dir);
  // }



  var tumKlasorler = [];
  var itemler = [];

  List.findOne({
    name: sayfaAdi
  }, function(err, docs) {
    tumKlasorler = [];
    itemler = [];


    if (docs) {
      //console.log("asd");

      if (!err) {

        File.find({
          klasorHangiKullanicida: sayfaAdi
        }, function(err, docs2) {



          docs2.forEach((item, i) => {
            tumKlasorler.push(item.klasorunAdi);




            File.find({
              klasorHangiKullanicida: sayfaAdi,
              klasorunAdi: item.klasorunAdi
            }, function(err, docs3) {

              itemler.push(docs3[0].items);


            });


          });


        });


        //console.log(tumKlasorler.length); // tumklasorler listesinin uzunlugu 0 çıkıyor nasıl ?


        setTimeout(
          () => {
            res.render("index", {
              sayfaninAdı: sayfaAdi,
              dosyaListesi: docs.items,
              klasorListesi: tumKlasorler,
              items: itemler
            }); //klasorlistesi yerine direkt files dan klasoru gonderecez.
          }, 1000); // burası for döngüsünden erken okunuyordu o yüzden biraz timeout verdim.


      } else {
        console.log(err);
      }
    } else {
      let liste = [];
      let klasor = [];
      File.find({
        klasorHangiKullanicida: sayfaAdi
      }, function(err, docs2) {


        docs2.forEach((item, i) => {
          tumKlasorler.push(item.klasorunAdi);



          File.find({
            klasorHangiKullanicida: sayfaAdi,
            klasorunAdi: item.klasorunAdi
          }, function(err, docs3) {

            console.log("docs3");
            console.log(docs3);


            itemler.push(docs3[0].items);

          });

        });

      });


      setTimeout(
        () => {
          res.render("index", {
            sayfaninAdı: sayfaAdi,
            dosyaListesi: liste,
            klasorListesi: tumKlasorler,
            items: itemler
          });
        }, 1000);


    }

  });


});


app.get("/:sayfaAdi/:klasorAdi", function(req, res) {

  let sayfaAdi = _.startCase(_.toLower(req.params.sayfaAdi));
  sayfaAdi = sayfaAdi.replace(/\s+/g, '');
  //console.log(req.params.sayfaAdi);

  let klasorAdi = (req.params.klasorAdi);

  let dir = "./uploads/"+sayfaAdi+"/"+klasorAdi;
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }

  let klasorunIcindekiKlasorler = [];  // bu klasörün altındaki oluşturulan klasörler listesi
                          // daha burayı yazmadık.
  let itemler = [];       // bu klasörün içine yüklenen itemler listesi.

  //res.send(sayfaAdi+"/"+klasorAdi);

  File.find({
    klasorHangiKullanicida: sayfaAdi,
    klasorunAdi: klasorAdi
  }, function(err, docs) {
    //console.log(docs);

      itemler.push(docs[0].items);


    // console.log(docs[0].items[0]);
    // console.log("itemler dizisi:");
    // console.log(itemler[0]);

    //bu çalışmaz yukarıdaki satır hatalı.

  });

  Dossier.find({
    ustKlasoru: klasorAdi
  }, function(err,docs2){

    //console.log("docs2: ");
    //console.log(docs2);
    docs2.forEach(item => klasorunIcindekiKlasorler.push(item) );

    //console.log(klasorunIcindekiKlasorler);
  });


  setTimeout(function(){
    res.render("insideFolder", {
      sayfaninAdı: sayfaAdi,
      klasorunAdi: klasorAdi,
      klasorListesi: klasorunIcindekiKlasorler,
      items: itemler
    });

  },1000);


  // ŞİMDİ KLASÖRÜN İÇİNDEKİ İTEMLERİ LİSTEYE KOYUP, INSIDE FOLDER EJS DOSYASINA GONDERMEMIZ GEREKIYOR.

});


app.get("/:sayfaAdi/:ustKlasor/:klasor", function(req,res){


let sayfaAdi = _.startCase(_.toLower(req.params.sayfaAdi));
sayfaAdi = sayfaAdi.replace(/\s+/g, '');

let klasorAdi = req.params.klasor;
let ustKlasor = req.params.ustKlasor;

let dir = "./uploads/"+sayfaAdi+"/"+ustKlasor+"/"+klasorAdi;
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

  let itemler = [];
  // console.log("sayfa adı: "+sayfaAdi);
  // console.log("klasörün adı: "+ klasorAdi);
  // console.log("üst klasör: "+ustKlasor);


  Dossier.find({
    name: klasorAdi,
    ustKlasoru: ustKlasor,
    kullanicisi: sayfaAdi
  }, function(err, docs) {

    // console.log("docs:");
    // console.log(docs[0].items);

    docs[0].items.forEach(item => itemler.push(item));
    //itemler.push(docs[0].items);
    // console.log(docs[0].items[0]);
    // console.log("itemler dizisi:");
    // console.log(itemler[0]);

    //bu çalışmaz yukarıdaki satır hatalı.
    // console.log("itemler listesi:" +itemler);

  });


  setTimeout(function(){
    res.render("klasoriciklasor.ejs",{
      sayfaninAdı: sayfaAdi,
      klasorunAdi: klasorAdi,
      ustKlasor: ustKlasor,
      items: itemler

    });

  },1000);


});











app.post("/kullaniciSayfasi", function(req, res) {

  //BURADA KAYIT EDİLİYOR VERİTABANINA KULLANICI ADI VE ŞİFRESİ.


  console.log("KAYIT YAPILIORRR");
  console.log(req.body);
  let userId = req.body.userId;
  let userPassword = req.body.userPassword;


  userPassword = encrypt(userPassword);
  console.log("şifrelenmiş password:" + userPassword);

  User.find({
    id: userId
  }, function(err, docs) {

    if (docs.length == 0) {
      User.insertMany([{
        id: userId,
        password: userPassword
      }], function(err) {
        if (err) {
          console.log(err);
        }

      });

      res.redirect("/" + userId);


    } else {
      res.render("wrongpassword",{yazilacakmetin:"Girdiğiniz Kullanıcı Adı Kullanılmaktadır."});
    }


  });




});

app.post("/signIn", function(req, res) {
  res.redirect("/kaydol"); // res.render("/signin.ejs") de yapılabilir kod kısalacak yukarıdaki get /kaydol silinebilir bu şekilde
});


app.post("/login", function(req, res) {
  res.redirect("/login");
});


app.post("/kontrol", function(req, res) {
  //console.log(req.body);


  console.log("GELEN KULLANICI ADINI BULACAZ.");
  console.log(req.body);
  let girilenId = req.body.userId;
  let girilenPassword = req.body.userPassword;


  //console.log("girilenPass:"+girilenPassword);

  User.find({
    id: girilenId
  }, function(err, docs) {

    // veritabanında girilen id bulunamazsa bu alttaki kod çalışıp direkt hata veriyor.
    if (docs.length == 0) {

      res.render("wrongpassword", {
        yazilacakmetin: "Kullanıcı kayıtlı değil, lütfen kayıt olunuz."
      });
    } else {

      //veritabanında id bulunursa aşağıdan devam ediyoruz.

      if (!err) {
        console.log(docs);

        let veritabanindakiSifre = docs[0].password;

        veritabanindakiSifre = decrypt(veritabanindakiSifre);

        if (veritabanindakiSifre == girilenPassword) {
          res.redirect(girilenId);
        } else {

          res.render("wrongpassword", {
            yazilacakmetin: "Hatalı Kullanıcı Şifresi Girdiniz."
          });
        }


      } else {

        console.log("kullanıcı adı hatalı !");
      }


    }



  });


});


app.post("/download", function(req, res) {

  //console.log(req);

  const file = `${__dirname}/uploads/RiotClientServices.exe`;
  res.download(file);

});



app.post('/uploadFile', upload.single('gelenFile'), function(req, res, next) {


  //console.log(req.body);
  console.log(req.file);
  let yuklenenSayfa = req.body.hangiSayfa;
  let dosyaName = req.file.originalname;

  let oldPath = "./uploads/"+dosyaName;
  let newPath = "./uploads/"+yuklenenSayfa+"/"+dosyaName;

  fs.rename(oldPath, newPath, function (err) {
  if (err) throw err
  console.log('Successfully renamed - AKA moved!')
  })


  // eğer dosya klasore yuklenecekse buraya gir.

  let item = new Item({
    name: dosyaName
  });

  item.save(function(err) {
    if (!err) {
      console.log("item successfully saved at mongodb");

    } else {
      console.log(err);
    }
  });


  const query = {
    name: yuklenenSayfa
  };



  List.findOneAndUpdate(query, {
    $push: {
      items: item
    }
  }, {
    upsert: true
  }, function(err, res) {
    if (!err) {
      //console.log(res);
    } else {
      console.log(err);
    }
  });


setTimeout(function(){ res.redirect(yuklenenSayfa); }, 200);


});


app.post("/delete", function(req, res) {

  console.log(req.body);

  let itemAdi = req.body.checkboxChecked;
  let sayfa = req.body.listName;

  //console.log("hidden input klasör adı:" + req.body.klasorAdi);

  let buttonOrCheckBox = req.body.button;
  if (buttonOrCheckBox) {
    console.log("button tıklandı.");
    console.log(buttonOrCheckBox);




    const file = `${__dirname}/uploads/`+sayfa+"/"+buttonOrCheckBox;
    res.download(file); // Set disposition and send it.

  // ÜST TARAF İNDİRME KISMI ORAYA ELLEME.
  } else {

    console.log("KLASÖRSÜZ DOSYA SİLME BLOGUNA GİRİLDİ.");


    List.findOneAndUpdate({
      name: sayfa,

    }, {
      $pull: {
        "items": {
          "name": itemAdi
        }
      }
    }, function(err, doc) {
      //console.log(doc);


      setTimeout(
        () => {

            let filePath = `${__dirname}/uploads/`+sayfa+"/"+itemAdi;
            fs.unlinkSync(filePath);

        }, 1000);

        res.redirect(sayfa);

    });


  }



});

app.post("/deleteKlasorici", function(req,res){

  //console.log(req.body);

  let itemAdi = req.body.checkboxChecked;
  let kullaniciAdi = req.body.listName;
  let klasorunAdi = req.body.klasorAdi;
  let ustKlasor = req.body.ustKlasor;


  let buttonOrCheckBox = req.body.button;
  if (buttonOrCheckBox) {
    console.log("button tıklandı.");
    console.log(buttonOrCheckBox);




    const file = `${__dirname}/uploads/`+kullaniciAdi+"/"+ustKlasor+"/"+klasorunAdi+"/"+buttonOrCheckBox;
    res.download(file); // Set disposition and send it.

  // ÜST TARAF İNDİRME KISMI ORAYA ELLEME.
  } else {

    console.log("KLASOR İÇİNDE KLASORDEN DOSYA SİLME BLOGUNA GİRİLDİ.");
    console.log(itemAdi);

      Dossier.findOneAndUpdate({
        name: klasorunAdi,
        ustKlasoru: ustKlasor,
        kullanicisi: kullaniciAdi
      }, {
        $pull: {
          "items": {
            "name": itemAdi
          }
        }
      }, function(err, doc) {
        //console.log(doc);


        setTimeout(
          () => {

              let filePath = `${__dirname}/uploads/`+kullaniciAdi+"/"+ustKlasor+"/"+klasorunAdi+"/"+itemAdi;
              fs.unlinkSync(filePath);

          }, 1000);

          res.redirect(kullaniciAdi+"/"+ustKlasor+"/"+klasorunAdi);

      });

  }









});

app.post("/deleteFromKlasor", function(req,res){

  //console.log(req.body);
  let itemAdi = req.body.checkboxChecked;
  let kullaniciAdi = req.body.listName;
  let klasorunAdi = req.body.klasorAdi;
  console.log("KLASOR İÇİNDEN DOSYA SİLME BLOGUNA GİRİLDİ.");


  let buttonOrCheckBox = req.body.button;
  if (buttonOrCheckBox) {
    console.log("button tıklandı.");
    console.log(buttonOrCheckBox);




    const file = `${__dirname}/uploads/`+kullaniciAdi+"/"+klasorunAdi+"/"+buttonOrCheckBox;
    res.download(file); // Set disposition and send it.

  // ÜST TARAF İNDİRME KISMI ORAYA ELLEME.
  } else {

    File.findOneAndUpdate({
      klasorunAdi: klasorunAdi,
      klasorHangiKullanicida: kullaniciAdi
    }, {
      $pull: {
        "items": {
          "name": itemAdi
        }
      }
    }, function(err, doc) {
      //console.log(doc);


      setTimeout(
        () => {

            let filePath = `${__dirname}/uploads/`+kullaniciAdi+"/"+klasorunAdi+"/"+itemAdi;
            fs.unlinkSync(filePath);

        }, 1000);

        res.redirect(kullaniciAdi+"/"+klasorunAdi);

    });


  }




});



app.post("/klasorOlustur", function(req, res) {

  console.log(req.body);
  let olusturulacakKlasorNerede = req.body.yeniKlasor;
  let olusturulacakKlasorunAdi = req.body.buttonClicked;




  let file = new File({
    klasorHangiKullanicida: olusturulacakKlasorNerede,
    klasorunAdi: olusturulacakKlasorunAdi,
    items: []
  });

  file.save(function(err) {
    if (!err) {
      console.log("file successfully saved at mongodb");

    } else {
      console.log(err);
    }
  });


setTimeout(function(){ res.redirect(olusturulacakKlasorNerede); }, 200);


});

app.post("/klasoriciKlasorOlustur", function(req,res){
  //console.log(req.body);
  let ustKlasor = req.body.klasorunAdi;  //üst klasörün adı
  let klasorunAdi = req.body.buttonClicked;
  let kullanicininAdi = req.body.yeniKlasor;

  console.log("üst klasörü: "+ ustKlasor);
  console.log("klasorun ismi" + klasorunAdi);
  console.log("kullanıcı adı: "+ kullanicininAdi);


  let klasoriciKlasor = new Dossier ( {
    name:klasorunAdi,
    ustKlasoru: ustKlasor,
    kullanicisi:kullanicininAdi,
    items: []
  })

  klasoriciKlasor.save(function(err){
    if(err){
      console.log(err);
    }else{
      console.log("klasor ici klasor veritabanına kaydedildi.");
    }
  })


setTimeout(function(){ res.redirect(kullanicininAdi+"/"+ustKlasor); }, 200);


});


app.post('/klasorUploadFile', upload.single('gelenFile'), function(req, res, next) {


  console.log(req.body.klasorAdi + "-----" + "KLASÖRÜN ADI");
  let klasorunAdi = req.body.klasorAdi;
  // klasörün adının baş harfi büyük çıkıyor o yüzden hata alıyoruz. küçüğe çevir.
  // halledildi.
  let hangiSayfaninKlasoru = req.body.hangiSayfa;
  console.log(req.body.hangiSayfa + "---------------" + "BU KLASÖR HANGİ SAYFANIN KLASÖRÜ?");

  let yuklenenDosyaName = req.file.originalname;
  console.log(yuklenenDosyaName + "--------------------------- YUKLENEN DOSYANIN ADI");
  // console.log("Klasörün Bilgileri : ");
  // console.log(req.file);
  let oldPath = "./uploads/"+yuklenenDosyaName;
  let newPath = "./uploads/"+hangiSayfaninKlasoru+"/"+klasorunAdi+"/"+yuklenenDosyaName;

  fs.rename(oldPath, newPath, function (err) {
  if (err) throw err
  console.log('Successfully renamed - AKA moved!')
  });



  let item = new Item({
    name: yuklenenDosyaName
  });

  item.save(function(err) {
    if (!err) {
      console.log("DOSYA ADI İTEM OLARAK KAYDEDİLDİ.");

    } else {
      console.log("itemi kaydederken hata verdi.");
      console.log(err);

    }
  });


  File.findOne({
    klasorHangiKullanicida: req.body.hangiSayfa,
    klasorunAdi: req.body.klasorAdi
  }, function(err, doc2) {
    if(!err){
      doc2.items.push(item);
      doc2.save();
      console.log("doc:"+doc2);
      console.log(doc2);
    }else{
      console.log("hata var");
      console.log(err);
    }

  });

  setTimeout(function(){ res.redirect(req.body.hangiSayfa+"/"+req.body.klasorAdi); }, 200);









});




app.post("/deleteFile", function(req, res) {




  const klasor = req.body.klasorunAdi;
  const sayfa = req.body.sayfaninAdi;

  let path = `${__dirname}/uploads/`+sayfa+"/"+klasor;
  console.log(path);


  try {
    deleteFolderRecursive(path);

  } catch(err) {
    console.error(err);
  }

  console.log("klasor: " + klasor + " sayfa: " + sayfa);
  File.findOneAndDelete({
    klasorHangiKullanicida: sayfa,
    klasorunAdi: klasor
  }, function(err, docs) {
    if (!err) {
      console.log("klasör silindi");



    } else {
      console.log(err);
    }
  });

  res.redirect(req.body.sayfaninAdi);

});


app.post("/klasoreGit",function(req,res){


  let klasorunAdi = req.body.hangiKlasoreTiklandi;
  let hangiKullanicidanGeliyor = req.body.hangiKullanicidanGeliyor;

  console.log(klasorunAdi+ " " + hangiKullanicidanGeliyor);



  res.redirect(hangiKullanicidanGeliyor+"/"+klasorunAdi);


});


app.post("/klasoriciKlasoreGit", function(req,res){
  //console.log(req.body);
  let tiklananKlasor = req.body.hangiKlasoreTiklandi;
  let ustKlasor = req.body.ustKlasor;
  let klasorunKullanicisi = req.body.hangiKullanicidanGeliyor;

//   var metin =  {
//   "Tıklanan Klasor: " : tiklananKlasor,
//   " Üst Klasör: " : ustKlasor,
//   " Kullanıcı: " : klasorunKullanicisi
// }


  res.redirect(klasorunKullanicisi+"/"+ustKlasor+"/"+tiklananKlasor);
});

app.post("/klasoriciKlasoruSil", function(req,res){
  //console.log(req.body);
  let sayfaninAdi = req.body.sayfaninAdi;
  let ustKlasor = req.body.ustKlasor;
  let klasorunAdi = req.body.klasorunAdi;

  let path = `${__dirname}/uploads/`+sayfaninAdi+"/"+ustKlasor+"/"+klasorunAdi;
  console.log(path);


  try {
    deleteFolderRecursive(path);

  } catch(err) {
    console.error(err);
  }

  Dossier.findOneAndDelete({
    name: klasorunAdi,
    ustKlasoru: ustKlasor,
    kullanicisi: sayfaninAdi
  }, function(err, docs) {
    if (!err) {
      console.log("klasör silindi");



    } else {
      console.log(err);
    }
  });


  res.redirect(sayfaninAdi+"/"+ustKlasor);
});


app.post('/klasoriciKlasorUploadFile', upload.single('gelenFile'), function(req, res, next) {

  let klasorunAdi =req.body.klasorunAdi;
  let ustKlasorunAdi = req.body.ustKlasorunAdi;
  let sayfaninAdi = (req.body.sayfaninAdi).trim();
  let yuklenenDosyaName = req.file.originalname;

console.log(req.body);
console.log(klasorunAdi +" ---------------- KLASÖRÜN İÇİNDEKİ KLASÖRÜN ADI");
console.log(ustKlasorunAdi +" ---------------- ÜST KLASÖRÜN ADI");
console.log(sayfaninAdi +" ---------------- SAYFANIN ADI");
console.log(yuklenenDosyaName+"------------------ YUKLENEN DOSYANIN İSMİ")

let oldPath = "./uploads/"+yuklenenDosyaName;
let newPath = "./uploads/"+sayfaninAdi+"/"+ustKlasorunAdi+"/"+klasorunAdi+"/"+yuklenenDosyaName;

fs.rename(oldPath, newPath, function (err) {
if (err) throw err
console.log('Successfully renamed - AKA moved!')
});



let item = new Item({
  name: yuklenenDosyaName
});

item.save(function(err) {
  if (!err) {
    console.log("DOSYA ADI İTEM OLARAK KAYDEDİLDİ.");

  } else {
    console.log("itemi kaydederken hata verdi.");
    console.log(err);

  }
});


Dossier.findOne({
  ustKlasoru: ustKlasorunAdi,
  name: klasorunAdi,
  kullanicisi: sayfaninAdi
}, function(err, doc2) {
  if(!err){
    doc2.items.push(item);
    doc2.save();
    console.log("KLASÖRÜN İTEMİ DOSSİERS COLLECTİONUNDKAİ İLGİLİ İTEME EKLENDİ.");
    // console.log("doc:"+doc2);
    // console.log(doc2);
  }else{
    console.log("hata var");
    console.log(err);
  }

});



res.redirect(sayfaninAdi+"/"+ustKlasorunAdi+"/"+klasorunAdi);


});


app.post("/geriDon", function(req,res){


  let ustKlasor = (req.body.hangiKullanicidanGeliyor).trim();
  console.log(req.body);
  res.redirect(ustKlasor);

});

app.post("/geriDonKlasorici", function(req,res){

  console.log(req.body);

  let kullaniciAdi = (req.body.listName).trim();
  let ustKlasor = (req.body.ustKlasor).trim();



  res.redirect(kullaniciAdi+"/"+ustKlasor);

});


app.post("/wrongPass", function(req,res){

  let neredenGeldi = req.body.neredenGeldi;

  if(neredenGeldi == "Girdiğiniz Kullanıcı Adı Kullanılmaktadır.") {
    res.redirect("/kaydol");
  }else{
    res.redirect("/login");
  }

});

app.post("/items",function(req,res){
  console.log(req.body);

  let kullanici = req.body.listName;
  let item = req.body.button;

  List.find({name:kullanici}, function(err,docs){
    if(!err){

      docs[0].items.forEach((element,index) => {
        if(element.name == item) {
          //console.log(element._id);

          // İTEMİN İD SİNİ ALIYORUZ BURDAN. SADECE İNDEX SAYFASI İÇİN GEÇERLİ BU.
          // BURADAN İD YI ALDIKTAN SONRA POST A BU İD İLE SAYFAYI YONLENDIRECEGIZ. /kullanici/id şeklinde.


          res.redirect(kullanici+"/items/"+item+"/"+element._id);
        }
        //console.log(element);
      })

    }else{
      console.log(err);
    }
  })



});


app.post("/klasorItems",function(req,res){
  console.log("asd");
  console.log(req.body);

  let kullanici = req.body.listName;
  let item = req.body.button;
  let klasor = req.body.klasorAdi;
  let id;

  File.find({klasorHangiKullanicida:kullanici,klasorunAdi:klasor}, function(err,docs){
    if(!err){
      //console.log(docs);

        docs[0].items.forEach((element,index) => {
          if(element.name == item) {
            id = element._id;
            //console.log(kullanici+"/items/"+klasor+"/"+item+"/"+id);
            setTimeout(function(){
               res.redirect(kullanici+"/items/"+klasor+"/"+item+"/"+id);
              }, 500);

          }

        });



    }else{
      console.log(err);
    }
  });


});

app.post("/klasoriciKlasoritems", function(req,res){
  console.log(req.body);
  let kullanici = req.body.listName;
  let item = req.body.button;
  let klasor = req.body.klasorAdi;
  let ustKlasor = req.body.ustKlasor;
  let id;


  Dossier.find({name:klasor, ustKlasoru:ustKlasor, kullanicisi:kullanici}, function(err,docs){
    if(!err){
      //console.log(docs);
      docs[0].items.forEach((element,index) => {

        //console.log(element._id);
        if(element.name == item) {

          id = element._id;

          setTimeout(function(){
              console.log(kullanici+"/items/"+ustKlasor+"/"+klasor+"/"+item+"/"+id);
             res.redirect(kullanici+"/items/"+ustKlasor+"/"+klasor+"/"+item+"/"+id);
           }, 700);
        }
      });
    }else{
      console.log(err);
    }
  });
});











app.listen(3000, function(req, res) {
  console.log("server started at port 3000");
});
