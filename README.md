# Navodila uporabe repozitorija

## Kloniranje repozitorija:
    -prenesi in odpri WebStorm ide v prazni mapi, kjer zelis imeti projekt
    -odpri VCS->Git->Clone...
    -pod URL prilepi https://gitlab.com/SasoIvic/blockchain_sabla.git in kloniraj

## Delanje nalog:
    -Preveri da si na master branchu (spodaj desno Git: master)
    -Ce ne pa ga izberi (checkout) pod lokalnimi branchi
    -pull-aj branch z ctrl+T
    -ustvari novi branch (Git: master -> Git Branches -> New Branch), ki mu daj ime taska
    -ko končas z nalogo jo commit-aj (ctrl+k), commit message naj bo ime taska
    -push-aj svoj lokalni branch (ctrl+shift+k)
    -idi pod zavihek version control (alt+9 ... da se ti zavihek pojavi spodaj levo) in odpri tab console
    -odpri link do merge requesta ki ti odpre merge request v git labu
    -ime merge requesta naj bo ime taska
    -označi checkbox delete branch on merge
    -assign-aj merge request na Sašota (in mi povej da bom mergal) / lahko tudi na sebe in nato sam mergaj na masterja
    -potrdi merge request

## Sprejemanje merge requesta:
    -checkout-aj masterja in ga pull-aj
    -če je neposredno merganje mogoče klikni gumb merge
    -če ne, si lokalno prenesi branch, ki ga zelis mergat (check out as) iz remote repozitorija
    -pull-aj ta branch
    -klikni na master branch spodaj desno in izberi rebase current on to selected
    -force push-aj ta branch
    -nato pa lahko branch neposredno mergas v git labu

## Dodajanje na Heroku:
    -checkout-aj master, ki je up to date
    -git push heroku master
    -preveri heroku spletno stran na linku: https://stormy-hamlet-63530.herokuapp.com/

## Dostop do baze:
    -https://www.mongodb.com/cloud/atlas
    login: email:ivic.saso.sola@gmail.com geslo:SaBla_Is_3






