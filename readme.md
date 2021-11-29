# Varmintz Agent AI

### Nama Kelompok : Guardians of The Galaxy

### Anggota Kelompok :

- 1119002 - Albertus Angkuw
- 1119004 - Calvin Jeremy
- 1119006 - William Juniar
- 1119028 - Aji Parama
- 1119038 - Elangel Neilea

#### Deskripsi

<p>
Agen Player : Rubah yang berjalan melintasi rintangan berupa 
manusia, kendaraan, dan air untuk mencapai finish line
Win Condition : Ketika berhasil mencapai finish line
Lose Condition : Ketika nyawa player habis
Algoritma : A*, minimax, CSP (dapat berubah)
</p>

![crossy road](https://user-images.githubusercontent.com/15321738/89792114-c0aad600-db41-11ea-92de-437b0aae65a1.PNG)

## GIT (Version Control)

#### Mengatur Username & Email

```
git config --global user.name "Adi Budi "
git config --global user.email "adibudi@gmail.com"
* Cara diatas untuk mengatur disemua repositori, untuk spesifik hilangkan "--global"
```

#### Cara Clone Lokal Git

```
git clone https://github.com/albertusangkuw/Cross-Road-Agent.git
```

#### Push

```
git add .
git commit -m "Your messages"
git push -u origin main
```

Jika terjadi error seperti ini :

```
To https://github.com/albertusangkuw/Cross-Road-Agent.git
 ! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to 'https://github.com/albertusangkuw/Cross-Road-Agent.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. Integrate the remote changes (e.g.
hint: 'git pull ...') before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
```

Maka selesaikan dengan :

```
git pull origin main
git push -u origin main
```

Jika masih terjadi error ketika pull origin main :
Maka cari file yang konflik kemudian edit pilih yang bermasalah
Kemudian jalankan

```
git add .
git commit -m "Merge to ..isi command..."
git push -u origin main
```

#### Pull

```
git pull origin main
```
