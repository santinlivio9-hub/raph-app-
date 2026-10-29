// Source « saisie en dur » de la base joueurs.
// Clubs et valeurs marché : approximation saison 2025-26 (type Transfermarkt, pas de scraping).
// Performances (`perf`) : saison de référence 2024-25, championnat, valeurs APPROXIMATIVES saisies à la main.
//   → pour des chiffres officiels, utiliser `npm run data:update-stats` (API-Football, clé dans .env).
//
// Format : nom|prénom|poste|postes secondaires|club|compétition|nationalité|âge|note générale|valeur (M€)|notoriété (1-5)|perf
// perf    : matchs,minutes,buts,passes décisives,clean sheets,note moyenne /10
// Compétitions : L1, PL, LIGA, SA, BL, SPL, MLS, LP, TSL, ED, BRA, ARG, MEX, QSL
// Nationalités : codes de src/data/countries.ts
// Génère src/data/players.json via `npm run data:build`.

export const PERF_SEASON = '2024-25';

export const SOURCE = `
Courtois|Thibaut|GK||Real Madrid|LIGA|BE|34|89|20|5|34,3060,0,0,10,7.0
Alisson||GK||Liverpool|PL|BR|33|88|17|5|28,2520,0,0,9,6.9
Donnarumma|Gianluigi|GK||Manchester City|PL|IT|27|89|40|5|27,2430,0,0,9,6.9
Ter Stegen|Marc-André|GK||FC Barcelone|LIGA|DE|34|84|8|5|3,270,0,0,1,6.8
Szczęsny|Wojciech|GK||FC Barcelone|LIGA|PL|36|80|1|4|15,1350,0,0,6,6.8
Maignan|Mike|GK||AC Milan|SA|FR|31|87|30|4|35,3150,0,0,10,6.9
Oblak|Jan|GK||Atlético Madrid|LIGA|SI|33|87|18|4|38,3420,0,0,16,6.9
Raya|David|GK||Arsenal|PL|ES|30|87|40|4|38,3420,0,0,13,6.9
Arrizabalaga|Kepa|GK||Arsenal|PL|ES|31|77|6|4|31,2790,0,0,9,6.8
Sommer|Yann|GK||Inter|SA|CH|37|84|3|4|33,2970,0,0,14,6.8
Kobel|Gregor|GK||Borussia Dortmund|BL|CH|28|86|40|4|32,2880,0,0,9,6.9
Martínez|Emiliano|GK||Aston Villa|PL|AR|33|86|20|5|34,3060,0,0,9,6.8
Costa|Diogo|GK||FC Porto|LP|PT|26|85|40|4|32,2880,0,0,13,7.0
Simón|Unai|GK||Athletic Club|LIGA|ES|29|85|25|4|33,2970,0,0,14,7.0
Neuer|Manuel|GK||Bayern Munich|BL|DE|40|84|4|5|25,2250,0,0,10,6.8
Sánchez|Robert|GK||Chelsea|PL|ES|28|81|18|4|37,3330,0,0,11,6.6
Onana|André|GK||Trabzonspor|TSL|CM|30|79|10|4|34,3060,0,0,8,6.6
Pickford|Jordan|GK||Everton|PL|EN|32|84|18|4|38,3420,0,0,13,7.0
Ederson||GK||Fenerbahçe|TSL|BR|32|84|15|5|26,2340,0,0,8,6.7
Chevalier|Lucas|GK||Paris Saint-Germain|L1|FR|24|83|40|4|33,2970,0,0,13,7.0
Samba|Brice|GK||Stade Rennais|L1|FR|32|81|15|4|29,2610,0,0,9,6.8
Bounou|Yassine|GK||Al-Hilal|SPL|MA|35|84|5|4|32,2880,0,0,12,6.9
Mendy|Édouard|GK||Al-Ahli|SPL|SN|34|80|3|4|30,2700,0,0,11,6.8
Lloris|Hugo|GK||Los Angeles FC|MLS|FR|39|73|1|5|32,2880,0,0,9,6.8
Ramsdale|Aaron|GK||Newcastle|PL|EN|28|78|15|4|28,2520,0,0,3,6.7
De Gea|David|GK||Fiorentina|SA|ES|35|82|3|5|34,3060,0,0,12,7.1
Navas|Keylor|GK||Newell's Old Boys|ARG|CR|39|77|1|5|5,450,0,0,2,6.8
Areola|Alphonse|GK||West Ham|PL|FR|33|78|4|4|26,2340,0,0,4,6.7
Livaković|Dominik|GK||Girona|LIGA|HR|31|79|6|4|30,2700,0,0,10,6.8
Van Dijk|Virgil|DC||Liverpool|PL|NL|35|89|25|5|37,3330,3,1,15,7.3
Konaté|Ibrahima|DC||Liverpool|PL|FR|27|85|45|4|31,2650,1,1,12,7.0
Saliba|William|DC||Arsenal|PL|FR|25|88|80|4|35,3100,2,0,13,7.0
Magalhães|Gabriel|DC||Arsenal|PL|BR|28|87|75|4|28,2470,3,1,10,7.0
Dias|Rúben|DC||Manchester City|PL|PT|29|87|70|4|27,2300,0,1,8,6.9
Stones|John|DC|MC|Manchester City|PL|EN|32|82|15|4|9,610,1,0,2,6.7
Gvardiol|Joško|DC|DG|Manchester City|PL|HR|24|86|75|4|37,3260,5,1,10,7.0
Marquinhos||DC||Paris Saint-Germain|L1|BR|32|85|20|5|26,2190,1,1,11,7.0
Rüdiger|Antonio|DC||Real Madrid|LIGA|DE|33|85|15|5|28,2410,0,1,10,6.9
Huijsen|Dean|DC||Real Madrid|LIGA|ES|21|83|70|4|30,2560,2,0,7,7.0
Militão|Éder|DC||Real Madrid|LIGA|BR|28|84|40|4|6,520,0,0,3,6.8
Alaba|David|DC|DG|Real Madrid|LIGA|AT|34|80|4|5|5,190,0,0,1,6.6
Upamecano|Dayot|DC||Bayern Munich|BL|FR|27|84|60|4|26,2210,1,0,10,7.0
Tah|Jonathan|DC||Bayern Munich|BL|DE|30|86|30|4|32,2810,2,1,13,7.1
Kim|Min-jae|DC||Bayern Munich|BL|KR|29|83|30|4|27,2370,2,0,10,6.9
Bastoni|Alessandro|DC|DG|Inter|SA|IT|27|86|70|4|34,2850,1,4,14,7.1
De Vrij|Stefan|DC||Inter|SA|NL|34|79|3|4|22,1640,1,0,8,6.8
Akanji|Manuel|DC|DD|Inter|SA|CH|31|83|20|4|21,1710,0,0,6,6.8
Araujo|Ronald|DC|DD|FC Barcelone|LIGA|UY|27|83|40|4|16,1100,0,0,6,6.7
Cubarsí|Pau|DC||FC Barcelone|LIGA|ES|19|84|80|4|35,2980,0,2,11,7.0
Romero|Cristian|DC||Tottenham|PL|AR|28|85|45|4|18,1500,1,1,3,6.8
Van de Ven|Micky|DC|DG|Tottenham|PL|NL|25|84|55|4|16,1300,1,1,3,6.9
Guéhi|Marc|DC||Crystal Palace|PL|EN|26|84|50|4|34,3060,3,0,9,7.0
Martínez|Lisandro|DC|DG|Manchester United|PL|AR|28|83|30|4|20,1760,2,0,4,6.8
De Ligt|Matthijs|DC||Manchester United|PL|NL|27|82|40|4|29,2320,3,0,6,6.8
Maguire|Harry|DC||Manchester United|PL|EN|33|78|8|5|24,1500,2,0,4,6.8
Yoro|Leny|DC||Manchester United|PL|FR|21|79|50|4|19,1350,0,0,3,6.6
Colwill|Levi|DC|DG|Chelsea|PL|EN|23|82|50|4|35,3150,1,1,11,6.9
Fofana|Wesley|DC||Chelsea|PL|FR|26|80|25|4|14,1100,0,0,4,6.8
Schlotterbeck|Nico|DC||Borussia Dortmund|BL|DE|26|84|45|4|28,2440,3,1,8,7.0
Bremer|Gleison|DC||Juventus|SA|BR|29|83|40|4|3,270,0,0,2,6.9
Tomori|Fikayo|DC||AC Milan|SA|EN|28|80|25|4|20,1630,0,0,6,6.7
Otamendi|Nicolás|DC||Benfica|LP|AR|38|77|1|4|29,2580,2,0,13,7.0
Laporte|Aymeric|DC||Athletic Club|LIGA|ES|32|81|8|4|30,2700,1,1,11,7.0
Dier|Eric|DC||AS Monaco|L1|EN|32|77|4|4|22,1500,1,0,5,6.7
Koulibaly|Kalidou|DC||Al-Hilal|SPL|SN|35|80|4|5|28,2440,1,1,10,7.0
Škriniar|Milan|DC||Fenerbahçe|TSL|SK|31|80|10|4|26,2300,1,0,9,6.9
Kimpembe|Presnel|DC||Qatar SC|QSL|FR|31|74|3|4|6,380,0,0,1,6.5
Ramos|Sergio|DC||CF Monterrey|MEX|ES|40|78|1|5|25,2130,6,0,8,7.1
Nacho||DC||Al-Qadsiah|SPL|ES|36|78|1|4|28,2500,1,0,10,7.0
Smalling|Chris|DC||Al-Fayha|SPL|EN|36|74|1|4|20,1750,1,0,5,6.8
Davies|Alphonso|DG|DD|Bayern Munich|BL|CA|25|84|40|4|21,1650,0,4,9,7.0
Hernández|Theo|DG||Al-Hilal|SPL|FR|28|84|30|5|30,2510,3,3,8,7.0
Mendes|Nuno|DG||Paris Saint-Germain|L1|PT|24|87|75|4|20,1650,1,6,9,7.2
Cucurella|Marc|DG||Chelsea|PL|ES|28|84|40|4|36,3100,5,1,11,7.0
Robertson|Andrew|DG||Liverpool|PL|SCO|32|82|12|4|33,2700,0,2,11,6.9
Kerkez|Milos|DG||Liverpool|PL|HU|22|80|45|4|38,3410,2,6,8,7.1
Dimarco|Federico|DG|MC|Inter|SA|IT|28|85|40|4|31,2310,3,8,12,7.1
Grimaldo|Alejandro|DG||Bayer Leverkusen|BL|ES|30|84|25|4|33,2710,4,7,10,7.2
Balde|Alejandro|DG||FC Barcelone|LIGA|ES|22|82|50|4|31,2580,0,6,10,7.0
Carreras|Álvaro|DG||Real Madrid|LIGA|ES|23|82|50|4|33,2900,1,4,12,7.0
Mendy|Ferland|DG||Real Madrid|LIGA|FR|31|80|8|4|21,1700,0,0,8,6.8
Calafiori|Riccardo|DG|DC|Arsenal|PL|IT|24|82|45|4|19,1180,2,1,6,6.9
Lewis-Skelly|Myles|DG|MC|Arsenal|PL|EN|19|79|45|4|23,1740,1,0,7,6.8
Aït-Nouri|Rayan|DG||Manchester City|PL|DZ|25|81|35|4|37,3060,4,7,6,7.1
Udogie|Destiny|DG||Tottenham|PL|IT|23|80|35|4|24,1980,0,3,4,6.8
Shaw|Luke|DG|DC|Manchester United|PL|EN|31|79|10|4|5,240,0,0,0,6.5
Gutiérrez|Miguel|DG||Naples|SA|ES|24|81|30|4|35,2980,2,5,10,7.1
Spinazzola|Leonardo|DG||Naples|SA|IT|33|76|2|4|20,1150,0,1,7,6.7
Estupiñán|Pervis|DG||AC Milan|SA|EC|28|80|20|4|29,2300,3,3,8,7.0
Digne|Lucas|DG||Aston Villa|PL|FR|33|79|5|4|31,2380,0,4,6,6.9
Hall|Lewis|DG||Newcastle|PL|EN|21|79|30|4|25,2140,0,3,8,7.0
Tagliafico|Nicolás|DG||Olympique Lyonnais|L1|AR|33|77|3|4|30,2580,2,3,9,6.9
Hernández|Lucas|DG|DC|Paris FC|L1|FR|30|79|8|4|17,1250,1,0,6,6.8
Gosens|Robin|DG||Fiorentina|SA|DE|32|78|5|4|32,2600,4,5,10,7.0
Chilwell|Ben|DG||RC Strasbourg|L1|EN|29|75|5|4|9,500,0,1,1,6.5
Zinchenko|Oleksandr|DG|MC|Nottingham Forest|PL|UA|29|77|8|4|14,900,0,1,3,6.7
Alba|Jordi|DG||Inter Miami|MLS|ES|37|78|1|5|30,2540,4,10,6,7.2
Tierney|Kieran|DG||Celtic|SPFL|SCO|29|75|4|4|20,1400,1,2,7,6.8
Sandro|Alex|DG|DC|Flamengo|BRA|BR|35|76|2|4|25,2000,1,3,9,7.0
Hakimi|Achraf|DD|AD|Paris Saint-Germain|L1|MA|27|88|80|5|29,2420,4,6,11,7.4
Alexander-Arnold|Trent|DD|MC|Real Madrid|LIGA|EN|27|86|70|5|33,2630,3,6,12,7.2
Carvajal|Dani|DD||Real Madrid|LIGA|ES|34|82|5|4|8,640,1,0,3,6.8
Koundé|Jules|DD|DC|FC Barcelone|LIGA|FR|27|85|55|4|35,3080,2,6,12,7.1
Frimpong|Jeremie|DD|AD|Liverpool|PL|NL|25|83|40|4|33,2240,3,5,9,7.0
Darmian|Matteo|DD|DC|Inter|SA|IT|36|75|1|4|22,1400,0,1,7,6.7
Di Lorenzo|Giovanni|DD|DC|Naples|SA|IT|32|83|10|4|38,3410,3,3,19,7.1
Timber|Jurriën|DD|DC|Arsenal|PL|NL|25|84|60|4|30,2440,1,3,11,7.0
White|Ben|DD|DC|Arsenal|PL|EN|28|80|25|4|17,980,0,1,5,6.8
James|Reece|DD|MC|Chelsea|PL|EN|26|84|45|4|19,1200,2,2,5,7.0
Gusto|Malo|DD||Chelsea|PL|FR|23|80|40|4|28,1880,0,4,7,6.9
Porro|Pedro|DD||Tottenham|PL|ES|26|83|45|4|37,3140,2,6,4,7.0
Walker|Kyle|DD|DC|Burnley|PL|EN|36|77|2|5|29,2310,0,1,7,6.7
Dalot|Diogo|DD|DG|Manchester United|PL|PT|27|80|30|4|33,2830,1,2,6,6.8
Mazraoui|Noussair|DD|DG|Manchester United|PL|MA|28|80|25|4|37,2900,0,1,7,6.8
Laimer|Konrad|DD|MC|Bayern Munich|BL|AT|29|81|30|4|29,2120,1,3,10,7.0
Llorente|Marcos|DD|MC|Atlético Madrid|LIGA|ES|31|83|25|4|33,2550,1,4,11,7.0
Livramento|Tino|DD||Newcastle|PL|EN|23|80|40|4|37,2930,0,1,12,6.9
Trippier|Kieran|DD||Newcastle|PL|EN|35|77|2|4|20,1350,0,2,5,6.7
Muñoz|Daniel|DD||Crystal Palace|PL|CO|30|81|30|4|36,3170,4,6,9,7.2
Wan-Bissaka|Aaron|DD||West Ham|PL|EN|28|78|20|4|36,3150,2,4,7,7.0
Semedo|Nélson|DD||Fenerbahçe|TSL|PT|32|77|5|4|31,2620,0,3,6,6.9
Pavard|Benjamin|DD|DC|Olympique de Marseille|L1|FR|30|81|20|4|20,1450,1,1,8,6.9
Clauss|Jonathan|DD||OGC Nice|L1|FR|33|77|4|4|29,2360,2,6,8,7.0
Meunier|Thomas|DD||Lille OSC|L1|BE|34|75|1|4|26,1980,1,3,8,6.9
Cancelo|João|DD|DG|Al-Hilal|SPL|PT|32|82|10|5|24,1980,2,6,8,7.2
Bellerín|Héctor|DD||Real Betis|LIGA|ES|31|75|4|4|23,1500,1,2,6,6.8
Danilo||DD|DC|Flamengo|BRA|BR|35|76|2|4|25,2050,1,1,10,7.0
Rodri||MC||Manchester City|PL|ES|30|89|75|5|4,170,0,0,0,6.9
Kovačić|Mateo|MC||Manchester City|PL|HR|32|81|15|4|26,1850,4,1,0,7.0
Reijnders|Tijjani|MC||Manchester City|PL|NL|27|85|70|4|36,2880,10,4,0,7.3
Silva|Bernardo|MC|AD|Manchester City|PL|PT|32|85|25|5|34,2560,2,3,0,7.0
Bellingham|Jude|MC|BU|Real Madrid|LIGA|EN|23|89|160|5|31,2640,9,8,0,7.4
Valverde|Federico|MC|DD,AD|Real Madrid|LIGA|UY|28|88|120|4|35,3030,6,4,0,7.2
Tchouaméni|Aurélien|MC|DC|Real Madrid|LIGA|FR|26|85|75|4|33,2700,0,1,0,7.0
Camavinga|Eduardo|MC|DG|Real Madrid|LIGA|FR|23|83|50|4|23,1350,0,1,0,6.8
Güler|Arda|MC|AD|Real Madrid|LIGA|TR|21|84|80|4|28,1350,3,8,0,7.1
Modrić|Luka|MC||AC Milan|SA|HR|40|83|3|5|35,2100,2,6,0,7.2
Pedri||MC||FC Barcelone|LIGA|ES|23|89|140|5|37,3060,4,5,0,7.6
De Jong|Frenkie|MC||FC Barcelone|LIGA|NL|29|86|45|4|31,2250,1,3,0,7.2
Gavi||MC||FC Barcelone|LIGA|ES|22|82|70|4|30,1450,2,3,0,6.9
López|Fermín|MC|AG|FC Barcelone|LIGA|ES|23|83|70|4|30,1450,6,7,0,7.0
Vitinha||MC||Paris Saint-Germain|L1|PT|26|88|100|4|29,2410,6,4,0,7.5
Neves|João|MC|DD|Paris Saint-Germain|L1|PT|21|87|120|4|31,2380,3,11,0,7.6
Zaïre-Emery|Warren|MC|DD|Paris Saint-Germain|L1|FR|20|82|60|4|27,1710,2,1,0,6.9
Ruiz|Fabián|MC||Paris Saint-Germain|L1|ES|30|84|40|4|27,1890,3,2,0,7.1
Rice|Declan|MC||Arsenal|PL|EN|27|88|120|5|35,2970,4,7,0,7.2
Ødegaard|Martin|MC||Arsenal|PL|NO|27|86|80|4|30,2350,3,8,0,7.1
Zubimendi|Martín|MC||Arsenal|PL|ES|27|86|70|4|36,3050,2,1,0,7.1
Mac Allister|Alexis|MC||Liverpool|PL|AR|27|86|85|4|35,2860,5,5,0,7.2
Wirtz|Florian|MC|AG|Liverpool|PL|DE|23|87|140|5|31,2360,10,12,0,7.8
Szoboszlai|Dominik|MC|AD|Liverpool|PL|HU|25|85|80|4|36,2650,6,6,0,7.0
Gravenberch|Ryan|MC||Liverpool|PL|NL|24|85|80|4|37,3170,0,4,0,7.2
Caicedo|Moisés|MC|DD|Chelsea|PL|EC|24|87|100|4|38,3410,1,4,0,7.3
Fernández|Enzo|MC||Chelsea|PL|AR|25|85|80|4|36,2870,6,7,0,7.1
Palmer|Cole|MC|AD|Chelsea|PL|EN|24|87|110|5|37,3200,15,8,0,7.4
Fernandes|Bruno|MC||Manchester United|PL|PT|31|86|40|5|36,3070,8,10,0,7.4
Mainoo|Kobbie|MC||Manchester United|PL|EN|21|79|45|4|25,1550,0,1,0,6.7
Casemiro||MC||Manchester United|PL|BR|34|79|5|5|21,1400,1,1,0,6.8
Mount|Mason|MC|AG|Manchester United|PL|EN|27|77|20|4|17,810,2,0,0,6.6
Tonali|Sandro|MC||Newcastle|PL|IT|26|84|60|4|36,2700,2,2,0,7.0
Guimarães|Bruno|MC||Newcastle|PL|BR|28|86|75|4|38,3370,5,6,0,7.3
Musiala|Jamal|MC|AG|Bayern Munich|BL|DE|23|88|140|5|25,1920,12,3,0,7.6
Kimmich|Joshua|MC|DD|Bayern Munich|BL|DE|31|88|45|5|33,2900,1,8,0,7.5
Goretzka|Leon|MC||Bayern Munich|BL|DE|31|80|12|4|30,2150,4,3,0,7.0
Barella|Nicolò|MC||Inter|SA|IT|29|87|70|4|33,2770,2,7,0,7.2
Çalhanoğlu|Hakan|MC||Inter|SA|TR|32|85|20|4|30,2420,5,3,0,7.2
Mkhitaryan|Henrikh|MC||Inter|SA|AM|37|80|1|4|35,2730,3,4,0,7.0
Frattesi|Davide|MC||Inter|SA|IT|26|80|25|4|30,1500,3,3,0,6.8
De Bruyne|Kevin|MC||Naples|SA|BE|35|85|15|5|28,1720,4,8,0,7.3
McTominay|Scott|MC||Naples|SA|SCO|29|86|40|4|34,2900,12,4,0,7.4
Lobotka|Stanislav|MC||Naples|SA|SK|31|83|20|4|33,2830,1,1,0,7.0
Rabiot|Adrien|MC||AC Milan|SA|FR|31|83|20|4|29,2400,9,4,0,7.1
Koke||MC||Atlético Madrid|LIGA|ES|34|80|4|4|32,2040,0,2,0,7.0
Griezmann|Antoine|BU|MC,AG|Atlético Madrid|LIGA|FR|35|84|10|5|37,2560,8,6,0,7.2
Kanté|N'Golo|MC||Al-Ittihad|SPL|FR|35|82|5|5|33,2900,4,3,0,7.2
Fabinho||MC||Al-Ittihad|SPL|BR|33|78|5|4|31,2650,1,2,0,7.0
Brozović|Marcelo|MC||Al-Nassr|SPL|HR|33|79|5|4|29,2400,3,6,0,7.2
Milinković-Savić|Sergej|MC||Al-Hilal|SPL|RS|31|83|20|4|29,2500,7,9,0,7.5
Xhaka|Granit|MC||Sunderland|PL|CH|33|83|10|4|33,2850,2,5,0,7.2
Kessié|Franck|MC||Al-Ahli|SPL|CI|29|81|15|4|30,2600,5,3,0,7.1
Tielemans|Youri|MC||Aston Villa|PL|BE|29|82|25|4|36,3090,3,9,0,7.2
Simons|Xavi|MC|AG|Tottenham|PL|NL|23|84|60|4|33,2470,10,8,0,7.2
Paquetá|Lucas|MC||West Ham|PL|BR|29|80|35|4|33,2600,4,2,0,6.9
Højbjerg|Pierre-Emile|MC||Olympique de Marseille|L1|DK|31|81|10|4|34,2950,2,2,0,7.0
Guendouzi|Mattéo|MC||Lazio|SA|FR|27|80|25|4|36,2950,1,2,0,7.0
Thuram|Khéphren|MC||Juventus|SA|FR|25|82|50|4|33,2300,2,2,0,6.9
Locatelli|Manuel|MC||Juventus|SA|IT|28|81|20|4|35,2960,1,3,0,7.0
Tolisso|Corentin|MC||Olympique Lyonnais|L1|FR|32|78|5|4|32,2550,7,4,0,7.1
Pogba|Paul|MC||AS Monaco|L1|FR|33|77|3|5|0,0,0,0,0,6.0
Matić|Nemanja|MC||Sassuolo|SA|RS|38|74|1|4|31,2500,0,3,0,7.0
Can|Emre|MC|DC|Borussia Dortmund|BL|DE|32|78|5|4|25,1900,2,1,0,6.8
Gündoğan|İlkay|MC||Galatasaray|TSL|DE|35|81|4|5|33,2410,3,5,0,7.1
Busquets|Sergio|MC||Inter Miami|MLS|ES|38|77|1|5|31,2600,0,5,0,7.0
De Paul|Rodrigo|MC||Inter Miami|MLS|AR|32|79|15|4|33,2630,3,2,0,7.0
Isco||MC||Real Betis|LIGA|ES|34|80|3|5|15,1000,4,3,0,7.2
Müller|Thomas|MC|BU|Vancouver Whitecaps|MLS|DE|37|78|1|5|31,1650,6,8,0,7.1
Vinícius Júnior||AG|BU|Real Madrid|LIGA|BR|26|89|150|5|30,2470,11,8,0,7.4
Kvaratskhelia|Khvicha|AG||Paris Saint-Germain|L1|GE|25|87|90|4|31,2280,9,7,0,7.4
Barcola|Bradley|AG|AD|Paris Saint-Germain|L1|FR|23|83|60|4|34,2150,14,9,0,7.2
Raphinha||AG|AD,BU|FC Barcelone|LIGA|BR|29|88|80|5|36,3020,18,9,0,7.8
Rashford|Marcus|AG|BU|FC Barcelone|LIGA|EN|28|81|40|5|27,1950,6,6,0,7.0
Torres|Ferran|AG|BU|FC Barcelone|LIGA|ES|26|81|35|4|30,1250,10,2,0,7.0
Leão|Rafael|AG|BU|AC Milan|SA|PT|27|85|70|4|36,2690,8,10,0,7.2
Doku|Jérémy|AG|AD|Manchester City|PL|BE|24|83|60|4|29,1500,3,6,0,7.0
Cherki|Rayan|AG|MC|Manchester City|PL|FR|22|83|50|4|30,2100,8,11,0,7.4
Martinelli|Gabriel|AG||Arsenal|PL|BR|25|82|50|4|36,2490,8,4,0,6.9
Trossard|Leandro|AG|BU|Arsenal|PL|BE|31|81|20|4|38,2330,8,9,0,7.0
Gakpo|Cody|AG|BU|Liverpool|PL|NL|27|84|65|4|35,2000,10,4,0,7.0
Mitoma|Kaoru|AG||Brighton|PL|JP|29|80|25|4|36,2620,10,4,0,7.0
Gordon|Anthony|AG|BU|Newcastle|PL|EN|25|83|60|4|34,2580,6,6,0,6.9
Williams|Nico|AG|AD|Athletic Club|LIGA|ES|24|85|70|4|30,2300,5,6,0,7.0
Díaz|Luis|AG|BU|Bayern Munich|BL|CO|29|85|65|4|36,2790,13,5,0,7.2
Gnabry|Serge|AG|AD|Bayern Munich|BL|DE|31|80|15|4|30,1700,8,4,0,7.0
Sané|Leroy|AG|AD|Galatasaray|TSL|DE|30|81|20|4|30,1600,7,4,0,7.0
Son|Heung-min|AG|BU|Los Angeles FC|MLS|KR|34|83|15|5|30,2300,7,9,0,7.0
Mané|Sadio|AG|BU|Al-Nassr|SPL|SN|34|80|6|5|31,2600,10,9,0,7.2
Coman|Kingsley|AG|AD|Al-Nassr|SPL|FR|30|80|20|4|28,1600,5,5,0,7.0
Neymar||AG|MC|Santos|BRA|BR|34|80|10|5|14,1050,4,3,0,7.2
Sterling|Raheem|AG|AD|Chelsea|PL|EN|31|76|10|5|17,860,0,2,0,6.6
Grealish|Jack|AG|MC|Everton|PL|EN|31|79|25|5|20,880,1,2,0,6.8
Nkunku|Christopher|AG|BU|AC Milan|SA|FR|28|79|30|4|27,880,3,2,0,6.8
Lookman|Ademola|AG|BU|Atalanta|SA|NG|28|84|45|4|31,2200,15,5,0,7.4
Garnacho|Alejandro|AG|AD|Chelsea|PL|AR|22|79|40|4|36,2560,6,3,0,6.8
Rogers|Morgan|AG|MC|Aston Villa|PL|EN|24|83|70|4|37,3060,8,10,0,7.2
Sancho|Jadon|AG|AD|Aston Villa|PL|EN|26|77|15|5|31,1600,3,5,0,6.8
Fati|Ansu|AG||AS Monaco|L1|ES|23|76|10|4|11,280,1,0,0,6.4
Thauvin|Florian|AG|AD|RC Lens|L1|FR|33|76|3|4|31,2540,7,10,0,7.3
Salah|Mohamed|AD||Liverpool|PL|EG|34|89|40|5|38,3370,29,18,0,8.0
Yamal|Lamine|AD|AG|FC Barcelone|LIGA|ES|19|90|200|5|35,2850,9,13,0,7.9
Saka|Bukayo|AD|AG|Arsenal|PL|EN|25|88|150|5|25,1720,6,10,0,7.5
Madueke|Noni|AD|AG|Arsenal|PL|EN|24|80|45|4|32,2140,7,3,0,6.9
Dembélé|Ousmane|AD|BU,AG|Paris Saint-Germain|L1|FR|29|90|80|5|29,2050,21,6,0,7.8
Doué|Désiré|AD|AG|Paris Saint-Germain|L1|FR|21|85|90|4|32,1950,6,6,0,7.2
Olise|Michael|AD|MC|Bayern Munich|BL|FR|24|87|120|4|34,2700,12,15,0,7.7
Kudus|Mohammed|AD|MC|Tottenham|PL|GH|26|82|45|4|32,2560,5,3,0,6.9
Kulusevski|Dejan|AD|MC|Tottenham|PL|SE|26|83|50|4|32,2500,7,10,0,7.1
Mbeumo|Bryan|AD|BU|Manchester United|PL|CM|27|84|70|4|38,3400,20,7,0,7.5
Diallo|Amad|AD||Manchester United|PL|CI|24|81|45|4|25,1750,6,6,0,7.1
Neto|Pedro|AD|AG|Chelsea|PL|PT|26|82|50|4|35,2470,4,6,0,6.9
Bowen|Jarrod|AD|BU|West Ham|PL|EN|29|82|40|4|34,2960,13,8,0,7.2
Semenyo|Antoine|AD|AG|Bournemouth|PL|GH|26|82|65|4|37,3150,11,6,0,7.1
Kubo|Takefusa|AD||Real Sociedad|LIGA|JP|25|81|40|4|36,2660,5,4,0,7.0
Rodrygo||AD|AG|Real Madrid|LIGA|BR|25|84|70|5|34,2400,6,7,0,7.0
Díaz|Brahim|AD|MC|Real Madrid|LIGA|MA|26|81|30|4|32,1370,4,3,0,6.8
Politano|Matteo|AD||Naples|SA|IT|33|80|8|4|38,2900,3,5,0,7.0
Pulisic|Christian|AD|AG|AC Milan|SA|US|28|84|45|4|34,2590,11,10,0,7.4
Dybala|Paulo|AD|BU|AS Rome|SA|AR|32|81|8|5|27,1850,6,4,0,7.1
Greenwood|Mason|AD|BU|Olympique de Marseille|L1|JM|25|83|40|4|34,2880,21,5,0,7.3
Messi|Lionel|AD|BU|Inter Miami|MLS|AR|39|86|15|5|28,2350,29,19,0,8.2
Di María|Ángel|AD|AG|Rosario Central|ARG|AR|38|78|2|5|20,1500,6,5,0,7.3
Mahrez|Riyad|AD||Al-Ahli|SPL|DZ|35|80|8|5|32,2650,13,10,0,7.4
Lozano|Hirving|AD|AG|San Diego FC|MLS|MX|31|76|6|4|25,1700,8,6,0,7.0
Chiesa|Federico|AD|AG|Liverpool|PL|IT|28|76|12|4|6,105,0,0,0,6.3
Foden|Phil|AD|MC|Manchester City|PL|EN|26|83|60|5|28,1800,7,2,0,6.9
Antony||AD||Real Betis|LIGA|BR|26|79|25|4|17,1350,5,3,0,7.3
Mbappé|Kylian|BU|AG|Real Madrid|LIGA|FR|27|91|180|5|34,2900,31,3,0,7.7
Haaland|Erling|BU||Manchester City|PL|NO|26|91|180|5|31,2750,22,3,0,7.2
Kane|Harry|BU||Bayern Munich|BL|EN|33|90|65|5|31,2560,26,8,0,7.7
Lewandowski|Robert|BU||FC Barcelone|LIGA|PL|38|84|8|5|34,2700,27,2,0,7.4
Martínez|Lautaro|BU||Inter|SA|AR|29|88|85|5|31,2500,12,3,0,7.1
Thuram|Marcus|BU|AG|Inter|SA|FR|29|85|70|4|35,2600,14,5,0,7.1
Osimhen|Victor|BU||Galatasaray|TSL|NG|27|86|75|5|30,2500,26,5,0,7.6
Isak|Alexander|BU||Liverpool|PL|SE|26|88|120|4|34,2760,23,6,0,7.5
Ekitike|Hugo|BU|AG|Liverpool|PL|FR|24|84|80|4|33,2620,15,8,0,7.3
Gyökeres|Viktor|BU||Arsenal|PL|SE|28|86|75|4|33,2780,39,6,0,8.1
Álvarez|Julián|BU||Atlético Madrid|LIGA|AR|26|88|100|4|37,2700,17,5,0,7.2
Lukaku|Romelu|BU||Naples|SA|BE|33|81|10|5|36,2950,14,10,0,7.1
Vlahović|Dušan|BU||Juventus|SA|RS|26|82|30|4|30,2000,10,2,0,6.9
David|Jonathan|BU||Juventus|SA|CA|26|83|40|4|30,2400,16,7,0,7.2
Šeško|Benjamin|BU||Manchester United|PL|SI|23|81|70|4|33,2500,13,5,0,7.0
Watkins|Ollie|BU||Aston Villa|PL|EN|30|83|40|4|38,2840,16,8,0,7.1
Jackson|Nicolas|BU||Bayern Munich|BL|SN|25|81|50|4|30,2400,10,5,0,6.9
Pedro|João|BU|MC|Chelsea|PL|BR|24|82|60|4|27,1990,10,5,0,7.2
Mateta|Jean-Philippe|BU||Crystal Palace|PL|FR|29|81|35|4|37,2860,14,2,0,6.9
Solanke|Dominic|BU||Tottenham|PL|EN|28|80|40|4|27,2050,9,3,0,6.8
Kolo Muani|Randal|BU|AD|Tottenham|PL|FR|27|80|35|4|16,1200,8,2,0,7.0
Ramos|Gonçalo|BU||Paris Saint-Germain|L1|PT|25|80|35|4|23,1050,10,2,0,7.0
Retegui|Mateo|BU||Al-Qadsiah|SPL|IT|27|81|30|4|36,2550,25,8,0,7.3
Kean|Moise|BU||Fiorentina|SA|IT|26|82|50|4|37,2930,19,3,0,7.1
Ronaldo|Cristiano|BU||Al-Nassr|SPL|PT|41|82|12|5|30,2600,25,3,0,7.3
Benzema|Karim|BU||Al-Ittihad|SPL|FR|38|83|8|5|30,2580,21,8,0,7.5
Endrick||BU||Real Madrid|LIGA|BR|20|77|35|4|20,450,1,0,0,6.5
Lacazette|Alexandre|BU||Neom SC|SPL|FR|35|76|3|4|31,2400,15,4,0,7.0
Giroud|Olivier|BU||Lille OSC|L1|FR|40|74|1|5|27,1900,9,4,0,6.9
Aubameyang|Pierre-Emerick|BU||Olympique de Marseille|L1|GA|37|77|2|5|30,2100,17,10,0,7.3
Suárez|Luis|BU||Inter Miami|MLS|UY|39|76|1|5|30,1950,10,10,0,7.1
Morata|Álvaro|BU||Côme|SA|ES|33|77|5|5|29,1900,7,3,0,6.8
Džeko|Edin|BU||Fiorentina|SA|BA|40|75|1|5|33,2500,14,6,0,7.1
Immobile|Ciro|BU||Bologne|SA|IT|36|74|2|4|30,2200,15,3,0,7.0
Vardy|Jamie|BU||Cremonese|SA|EN|39|74|1|5|34,2500,9,3,0,6.8
Füllkrug|Niclas|BU||West Ham|PL|DE|33|76|6|4|18,750,2,0,0,6.5
Jesus|Gabriel|BU|AG|Arsenal|PL|BR|29|78|25|4|17,820,0,2,0,6.6
Havertz|Kai|BU|MC|Arsenal|PL|DE|27|83|45|4|22,1700,9,3,0,6.9
Núñez|Darwin|BU||Al-Hilal|SPL|UY|27|79|40|4|30,1300,5,2,0,6.7
Toney|Ivan|BU||Al-Ahli|SPL|EN|30|80|20|4|30,2600,23,5,0,7.3
Oyarzabal|Mikel|BU|AG|Real Sociedad|LIGA|ES|29|81|25|4|32,2550,9,3,0,7.0
`;
