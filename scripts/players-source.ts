// Source « saisie en dur » de la base joueurs (valeurs approximatives, saison 2025-26).
// Format : nom|prénom|poste|postes secondaires (séparés par ,)|club|ligue|nationalité|âge|note|valeur marché (M€)
// Ligues : PL, LL, SA, BL, L1, LP, ED, SPL, TSL, MLS, GRL — nationalités : codes de src/data/countries.ts
// Génère src/data/players.json via `npm run data:build`.

export const SOURCE = `
Courtois|Thibaut|GK||Real Madrid|LL|BE|34|89|20
Alisson||GK||Liverpool|PL|BR|33|88|17
Donnarumma|Gianluigi|GK||Manchester City|PL|IT|27|89|40
Ter Stegen|Marc-André|GK||FC Barcelone|LL|DE|34|84|8
García|Joan|GK||FC Barcelone|LL|ES|25|83|30
Maignan|Mike|GK||AC Milan|SA|FR|31|87|30
Oblak|Jan|GK||Atlético Madrid|LL|SI|33|87|18
Raya|David|GK||Arsenal|PL|ES|30|87|40
Sommer|Yann|GK||Inter|SA|CH|37|84|3
Kobel|Gregor|GK||Borussia Dortmund|BL|CH|28|86|40
Martínez|Emiliano|GK||Aston Villa|PL|AR|33|86|20
Costa|Diogo|GK||FC Porto|LP|PT|26|85|40
Simón|Unai|GK||Athletic Club|LL|ES|29|85|25
Neuer|Manuel|GK||Bayern Munich|BL|DE|40|84|4
Sánchez|Robert|GK||Chelsea|PL|ES|28|81|18
Onana|André|GK||Trabzonspor|TSL|CM|30|79|10
Pickford|Jordan|GK||Everton|PL|EN|32|84|18
Ederson||GK||Fenerbahçe|TSL|BR|32|84|15
Verbruggen|Bart|GK||Brighton|PL|NL|23|81|30
Sels|Matz|GK||Nottingham Forest|PL|BE|34|82|12
Chevalier|Lucas|GK||Paris Saint-Germain|L1|FR|24|83|40
Carnesecchi|Marco|GK||Atalanta|SA|IT|25|82|35
Lunin|Andriy|GK||Real Madrid|LL|UA|27|79|12
Trapp|Kevin|GK||Paris FC|L1|DE|36|78|2
Flekken|Mark|GK||Bayer Leverkusen|BL|NL|33|80|8
Samba|Brice|GK||Stade Rennais|L1|FR|32|81|15
Bounou|Yassine|GK||Al-Hilal|SPL|MA|35|84|5
Svilar|Mile|GK||AS Rome|SA|RS|26|84|40
Di Gregorio|Michele|GK||Juventus|SA|IT|29|82|20
Meret|Alex|GK||Naples|SA|IT|29|80|10
Milinković-Savić|Vanja|GK||Naples|SA|RS|29|81|18
Lammens|Senne|GK||Manchester United|PL|BE|24|79|25
Baumann|Oliver|GK||Hoffenheim|BL|DE|36|80|3
Nübel|Alexander|GK||VfB Stuttgart|BL|DE|29|81|15
Remiro|Álex|GK||Real Sociedad|LL|ES|31|82|18
Mamardashvili|Giorgi|GK||Liverpool|PL|GE|25|82|30
Restes|Guillaume|GK||Toulouse|L1|FR|21|74|8
Köhn|Philipp|GK||AS Monaco|L1|CH|28|76|8
Diouf|Yehvann|GK||OGC Nice|L1|FR|26|76|10
Rulli|Gerónimo|GK||Olympique de Marseille|L1|AR|34|81|5
Mendy|Édouard|GK||Al-Ahli|SPL|SN|34|80|3
Lloris|Hugo|GK||Los Angeles FC|MLS|FR|39|73|1
Ramsdale|Aaron|GK||Newcastle|PL|EN|28|78|15
Çakır|Uğurcan|GK||Galatasaray|TSL|TR|30|81|15
Trubin|Anatoliy|GK||Benfica|LP|UA|25|81|30
Kovář|Matěj|GK||PSV Eindhoven|ED|CZ|26|75|6
Arrizabalaga|Kepa|GK||Arsenal|PL|ES|31|77|6
Leno|Bernd|GK||Fulham|PL|DE|34|79|5
Petrović|Đorđe|GK||Bournemouth|PL|RS|26|80|25
Henderson|Dean|GK||Crystal Palace|PL|EN|29|82|20
Lopes|Anthony|GK||FC Nantes|L1|PT|35|73|1
Musso|Juan|GK||Atlético Madrid|LL|AR|32|76|5
Okoye|Maduka|GK||Udinese|SA|NG|26|75|8
Wellenreuther|Timon|GK||Feyenoord|ED|DE|30|74|4
Van Dijk|Virgil|DC||Liverpool|PL|NL|35|89|25
Saliba|William|DC||Arsenal|PL|FR|25|88|90
Magalhães|Gabriel|DC||Arsenal|PL|BR|28|87|70
Dias|Rúben|DC||Manchester City|PL|PT|29|87|70
Marquinhos||DC||Paris Saint-Germain|L1|BR|32|85|20
Rüdiger|Antonio|DC||Real Madrid|LL|DE|33|85|15
Huijsen|Dean|DC||Real Madrid|LL|ES|21|83|70
Militão|Éder|DC||Real Madrid|LL|BR|28|84|40
Upamecano|Dayot|DC||Bayern Munich|BL|FR|27|84|60
Tah|Jonathan|DC||Bayern Munich|BL|DE|30|86|30
Kim|Min-jae|DC||Bayern Munich|BL|KR|29|83|30
Bastoni|Alessandro|DC|DG|Inter|SA|IT|27|86|70
Araujo|Ronald|DC|DD|FC Barcelone|LL|UY|27|83|40
Cubarsí|Pau|DC||FC Barcelone|LL|ES|19|84|80
Gvardiol|Joško|DC|DG|Manchester City|PL|HR|24|86|75
Pacho|Willian|DC||Paris Saint-Germain|L1|EC|24|84|60
Zabarnyi|Illia|DC||Paris Saint-Germain|L1|UA|23|81|50
Le Normand|Robin|DC||Atlético Madrid|LL|ES|29|82|25
Giménez|José María|DC||Atlético Madrid|LL|UY|31|81|12
Hancko|David|DC|DG|Atlético Madrid|LL|SK|28|82|30
Konaté|Ibrahima|DC||Liverpool|PL|FR|27|85|40
Romero|Cristian|DC||Tottenham|PL|AR|28|85|45
Van de Ven|Micky|DC|DG|Tottenham|PL|NL|25|84|65
Danso|Kevin|DC||Tottenham|PL|AT|27|78|20
Guéhi|Marc|DC||Crystal Palace|PL|EN|26|84|50
Lacroix|Maxence|DC||Crystal Palace|PL|FR|26|81|30
Martínez|Lisandro|DC|DG|Manchester United|PL|AR|28|83|30
De Ligt|Matthijs|DC||Manchester United|PL|NL|27|82|40
Yoro|Leny|DC||Manchester United|PL|FR|21|79|50
Colwill|Levi|DC|DG|Chelsea|PL|EN|23|82|50
Fofana|Wesley|DC||Chelsea|PL|FR|26|80|25
Schlotterbeck|Nico|DC||Borussia Dortmund|BL|DE|26|84|40
Tapsoba|Edmond|DC||Bayer Leverkusen|BL|BF|27|81|35
Badé|Loïc|DC||Bayer Leverkusen|BL|FR|26|78|20
Buongiorno|Alessandro|DC||Naples|SA|IT|27|82|35
Rrahmani|Amir|DC||Naples|SA|XK|32|82|10
Bremer|Gleison|DC||Juventus|SA|BR|29|83|40
Kalulu|Pierre|DC|DD|Juventus|SA|FR|26|81|30
Tomori|Fikayo|DC||AC Milan|SA|EN|28|80|25
Pavlović|Strahinja|DC||AC Milan|SA|RS|25|79|25
Akanji|Manuel|DC|DD|Inter|SA|CH|31|83|20
Ndicka|Evan|DC||AS Rome|SA|CI|26|81|30
Mancini|Gianluca|DC||AS Rome|SA|IT|30|80|18
Kossounou|Odilon|DC||Atalanta|SA|CI|25|79|25
Hincapié|Piero|DC|DG|Arsenal|PL|EC|24|82|50
Inácio|Gonçalo|DC||Sporting CP|LP|PT|24|81|40
Diomande|Ousmane|DC||Sporting CP|LP|CI|22|81|50
Silva|António|DC||Benfica|LP|PT|22|80|35
Otamendi|Nicolás|DC||Benfica|LP|AR|38|77|1
Botman|Sven|DC||Newcastle|PL|NL|26|80|30
Konsa|Ezri|DC|DD|Aston Villa|PL|EN|28|81|35
Van Hecke|Jan Paul|DC||Brighton|PL|NL|26|79|25
Murillo||DC||Nottingham Forest|PL|BR|24|81|50
Milenković|Nikola|DC||Nottingham Forest|PL|RS|28|81|25
Laporte|Aymeric|DC||Athletic Club|LL|ES|32|81|8
Vivian|Dani|DC||Athletic Club|LL|ES|26|80|30
Balerdi|Leonardo|DC||Olympique de Marseille|L1|AR|27|81|25
Aguerd|Nayef|DC||Olympique de Marseille|L1|MA|30|79|15
Diakité|Bafodé|DC||Lille OSC|L1|FR|25|79|30
Mbemba|Chancel|DC||Lille OSC|L1|CD|31|76|3
Jacquet|Jérémy|DC||Stade Rennais|L1|FR|21|75|25
Andersen|Joachim|DC||Fulham|PL|DK|30|78|12
Bednarek|Jan|DC||FC Porto|LP|PL|30|77|8
Sarr|Mamadou|DC||RC Strasbourg|L1|FR|21|73|15
Nyakossi|Tanguy|DC||Toulouse|L1|FR|22|72|6
Davies|Alphonso|DG|DD|Bayern Munich|BL|CA|25|84|40
Hernández|Theo|DG||Al-Hilal|SPL|FR|28|84|30
Mendes|Nuno|DG||Paris Saint-Germain|L1|PT|24|87|70
Cucurella|Marc|DG||Chelsea|PL|ES|28|84|40
Robertson|Andrew|DG||Liverpool|PL|SCO|32|82|12
Kerkez|Milos|DG||Liverpool|PL|HU|22|80|45
Dimarco|Federico|DG|MC|Inter|SA|IT|28|85|40
Augusto|Carlos|DG|DC|Inter|SA|BR|27|79|25
Grimaldo|Alejandro|DG||Bayer Leverkusen|BL|ES|30|84|25
Balde|Alejandro|DG||FC Barcelone|LL|ES|22|82|50
Carreras|Álvaro|DG||Real Madrid|LL|ES|23|82|50
Mendy|Ferland|DG||Real Madrid|LL|FR|31|80|8
Calafiori|Riccardo|DG|DC|Arsenal|PL|IT|24|82|45
Lewis-Skelly|Myles|DG|MC|Arsenal|PL|EN|19|79|45
O'Reilly|Nico|DG|MC|Manchester City|PL|EN|21|78|40
Aït-Nouri|Rayan|DG||Manchester City|PL|DZ|25|81|35
Udogie|Destiny|DG||Tottenham|PL|IT|23|80|35
Dorgu|Patrick|DG|AG|Manchester United|PL|DK|21|77|30
Shaw|Luke|DG|DC|Manchester United|PL|EN|31|79|10
Gutiérrez|Miguel|DG||Naples|SA|ES|24|81|30
Olivera|Mathías|DG|DC|Naples|SA|UY|28|79|15
Spinazzola|Leonardo|DG||Naples|SA|IT|33|76|2
Cambiaso|Andrea|DG|DD|Juventus|SA|IT|26|82|40
Estupiñán|Pervis|DG||AC Milan|SA|EC|28|80|20
Digne|Lucas|DG||Aston Villa|PL|FR|33|79|5
Maatsen|Ian|DG||Aston Villa|PL|NL|24|78|30
Mitchell|Tyrick|DG||Crystal Palace|PL|EN|26|79|25
Hall|Lewis|DG||Newcastle|PL|EN|21|79|30
Raum|David|DG||RB Leipzig|BL|DE|28|80|20
Svensson|Daniel|DG||Borussia Dortmund|BL|SE|24|77|20
Tagliafico|Nicolás|DG||Olympique Lyonnais|L1|AR|33|77|3
Palmieri|Emerson|DG||Olympique de Marseille|L1|IT|32|76|3
Medina|Facundo|DG|DC|Olympique de Marseille|L1|AR|27|79|20
Hernández|Lucas|DG|DC|Paris FC|L1|FR|30|79|8
Truffert|Adrien|DG||Bournemouth|PL|FR|24|78|20
Galán|Javi|DG||Atlético Madrid|LL|ES|31|76|4
Tavares|Nuno|DG||Lazio|SA|PT|26|78|20
Merlin|Quentin|DG||Stade Rennais|L1|FR|24|76|10
Cozza|Nicolas|DG||FC Nantes|L1|FR|27|73|4
Hakimi|Achraf|DD|AD|Paris Saint-Germain|L1|MA|27|88|70
Alexander-Arnold|Trent|DD|MC|Real Madrid|LL|EN|27|86|70
Carvajal|Dani|DD||Real Madrid|LL|ES|34|82|5
Koundé|Jules|DD|DC|FC Barcelone|LL|FR|27|85|55
Frimpong|Jeremie|DD|AD|Liverpool|PL|NL|25|83|40
Dumfries|Denzel|DD|AD|Inter|SA|NL|30|83|25
Di Lorenzo|Giovanni|DD|DC|Naples|SA|IT|32|83|10
Timber|Jurriën|DD|DC|Arsenal|PL|NL|25|84|60
White|Ben|DD|DC|Arsenal|PL|EN|28|80|25
James|Reece|DD|MC|Chelsea|PL|EN|26|84|45
Gusto|Malo|DD||Chelsea|PL|FR|23|80|40
Porro|Pedro|DD||Tottenham|PL|ES|26|83|45
Spence|Djed|DD|DG|Tottenham|PL|EN|26|78|20
Walker|Kyle|DD|DC|Burnley|PL|EN|36|77|2
Dalot|Diogo|DD|DG|Manchester United|PL|PT|27|80|30
Mazraoui|Noussair|DD|DG|Manchester United|PL|MA|28|80|25
Laimer|Konrad|DD|MC|Bayern Munich|BL|AT|29|81|30
Stanišić|Josip|DD|DC|Bayern Munich|BL|HR|26|79|25
Llorente|Marcos|DD|MC|Atlético Madrid|LL|ES|31|83|25
Molina|Nahuel|DD||Atlético Madrid|LL|AR|28|79|20
Ryerson|Julian|DD|DG|Borussia Dortmund|BL|NO|28|80|18
Livramento|Tino|DD||Newcastle|PL|EN|23|80|40
Trippier|Kieran|DD||Newcastle|PL|EN|35|77|2
Bellanova|Raoul|DD||Atalanta|SA|IT|26|79|20
Cash|Matty|DD||Aston Villa|PL|PL|28|79|20
Muñoz|Daniel|DD||Crystal Palace|PL|CO|30|81|30
Aina|Ola|DD|DG|Nottingham Forest|PL|NG|29|79|15
Wan-Bissaka|Aaron|DD||West Ham|PL|EN|28|78|20
Semedo|Nélson|DD||Fenerbahçe|TSL|PT|32|77|5
Pavard|Benjamin|DD|DC|Olympique de Marseille|L1|FR|30|81|20
Clauss|Jonathan|DD||OGC Nice|L1|FR|33|77|4
Meunier|Thomas|DD||Lille OSC|L1|BE|34|75|1
Cancelo|João|DD|DG|Al-Hilal|SPL|PT|32|82|10
Kristensen|Rasmus|DD|DC|Eintracht Francfort|BL|DK|29|77|12
Vanderson||DD||AS Monaco|L1|BR|25|79|25
Mingueza|Óscar|DD|DC|Celta Vigo|LL|ES|27|79|15
Martínez|Arnau|DD||Girona|LL|ES|23|77|15
Bellerín|Héctor|DD||Real Betis|LL|ES|31|75|4
Çelik|Zeki|DD||AS Rome|SA|TR|29|76|8
Seidu|Alidu|DD|DC|Stade Rennais|L1|GH|26|74|8
Sildillia|Kiliann|DD||SC Fribourg|BL|FR|24|74|8
Rodri||MC||Manchester City|PL|ES|30|89|65
Bellingham|Jude|MC|BU|Real Madrid|LL|EN|23|89|160
Valverde|Federico|MC|DD,AD|Real Madrid|LL|UY|28|88|120
Tchouaméni|Aurélien|MC|DC|Real Madrid|LL|FR|26|85|75
Camavinga|Eduardo|MC|DG|Real Madrid|LL|FR|23|83|50
Güler|Arda|MC|AD|Real Madrid|LL|TR|21|84|80
Pedri||MC||FC Barcelone|LL|ES|23|89|140
De Jong|Frenkie|MC||FC Barcelone|LL|NL|29|86|45
Gavi||MC||FC Barcelone|LL|ES|22|82|70
López|Fermín|MC|AG|FC Barcelone|LL|ES|23|83|70
Vitinha||MC||Paris Saint-Germain|L1|PT|26|88|100
Neves|João|MC|DD|Paris Saint-Germain|L1|PT|21|87|120
Zaïre-Emery|Warren|MC|DD|Paris Saint-Germain|L1|FR|20|82|60
Ruiz|Fabián|MC||Paris Saint-Germain|L1|ES|30|84|40
Rice|Declan|MC||Arsenal|PL|EN|27|88|110
Ødegaard|Martin|MC||Arsenal|PL|NO|27|86|80
Zubimendi|Martín|MC||Arsenal|PL|ES|27|86|70
Mac Allister|Alexis|MC||Liverpool|PL|AR|27|86|80
Wirtz|Florian|MC|AG|Liverpool|PL|DE|23|87|130
Szoboszlai|Dominik|MC|AD|Liverpool|PL|HU|25|85|75
Gravenberch|Ryan|MC||Liverpool|PL|NL|24|85|80
Caicedo|Moisés|MC|DD|Chelsea|PL|EC|24|87|100
Fernández|Enzo|MC||Chelsea|PL|AR|25|85|80
Palmer|Cole|MC|AD|Chelsea|PL|EN|24|87|110
Fernandes|Bruno|MC||Manchester United|PL|PT|31|86|40
Mainoo|Kobbie|MC||Manchester United|PL|EN|21|79|45
Tonali|Sandro|MC||Newcastle|PL|IT|26|84|60
Guimarães|Bruno|MC||Newcastle|PL|BR|28|86|75
Musiala|Jamal|MC|AG|Bayern Munich|BL|DE|23|88|130
Kimmich|Joshua|MC|DD|Bayern Munich|BL|DE|31|88|45
Barella|Nicolò|MC||Inter|SA|IT|29|87|65
Çalhanoğlu|Hakan|MC||Inter|SA|TR|32|85|20
De Bruyne|Kevin|MC||Naples|SA|BE|35|85|15
McTominay|Scott|MC||Naples|SA|SCO|29|86|40
Lobotka|Stanislav|MC||Naples|SA|SK|31|83|20
Modrić|Luka|MC||AC Milan|SA|HR|40|83|3
Rabiot|Adrien|MC||AC Milan|SA|FR|31|83|20
Reijnders|Tijjani|MC||Manchester City|PL|NL|27|85|70
Silva|Bernardo|MC|AD|Manchester City|PL|PT|32|85|25
Kovačić|Mateo|MC||Manchester City|PL|HR|32|81|15
Koke||MC||Atlético Madrid|LL|ES|34|80|4
Barrios|Pablo|MC||Atlético Madrid|LL|ES|23|83|60
Wharton|Adam|MC||Crystal Palace|PL|EN|22|81|50
Kanté|N'Golo|MC||Al-Ittihad|SPL|FR|35|82|5
Xhaka|Granit|MC||Sunderland|PL|CH|33|83|10
Baleba|Carlos|MC||Brighton|PL|CM|22|82|60
Kessié|Franck|MC||Al-Ahli|SPL|CI|29|81|15
Kamara|Boubacar|MC||Aston Villa|PL|FR|26|81|30
Tielemans|Youri|MC||Aston Villa|PL|BE|29|82|25
Simons|Xavi|MC|AG|Tottenham|PL|NL|23|84|60
Højbjerg|Pierre-Emile|MC||Olympique de Marseille|L1|DK|31|81|10
Guendouzi|Mattéo|MC||Lazio|SA|FR|27|80|25
Thuram|Khéphren|MC||Juventus|SA|FR|25|82|50
Koopmeiners|Teun|MC||Juventus|SA|NL|28|81|35
McKennie|Weston|MC|DD|Juventus|SA|US|27|80|20
Sangaré|Ibrahim|MC||Nottingham Forest|PL|CI|28|78|20
Berge|Sander|MC||Fulham|PL|NO|28|78|20
Tolisso|Corentin|MC||Olympique Lyonnais|L1|FR|32|78|5
Diouf|Andy|MC||Inter|SA|FR|23|77|20
Thomasson|Adrien|MC||RC Lens|L1|FR|32|76|4
Lees-Melou|Pierre|MC||Stade Brestois|L1|FR|33|75|3
Magnetti|Hugo|MC||Stade Brestois|L1|FR|28|74|6
Matić|Nemanja|MC||Sassuolo|SA|RS|38|74|1
Vinícius Júnior||AG|BU|Real Madrid|LL|BR|26|89|150
Kvaratskhelia|Khvicha|AG||Paris Saint-Germain|L1|GE|25|87|90
Barcola|Bradley|AG|AD|Paris Saint-Germain|L1|FR|23|83|60
Raphinha||AG|AD,BU|FC Barcelone|LL|BR|29|88|80
Rashford|Marcus|AG|BU|FC Barcelone|LL|EN|28|81|40
Torres|Ferran|AG|BU|FC Barcelone|LL|ES|26|81|35
Leão|Rafael|AG|BU|AC Milan|SA|PT|27|85|70
Doku|Jérémy|AG|AD|Manchester City|PL|BE|24|83|60
Cherki|Rayan|AG|MC|Manchester City|PL|FR|22|83|50
Martinelli|Gabriel|AG||Arsenal|PL|BR|25|82|50
Trossard|Leandro|AG|BU|Arsenal|PL|BE|31|81|20
Gakpo|Cody|AG|BU|Liverpool|PL|NL|27|84|65
Mitoma|Kaoru|AG||Brighton|PL|JP|29|80|25
Gordon|Anthony|AG|BU|Newcastle|PL|EN|25|83|65
Williams|Nico|AG|AD|Athletic Club|LL|ES|24|85|60
Díaz|Luis|AG|BU|Bayern Munich|BL|CO|29|85|60
Gnabry|Serge|AG|AD|Bayern Munich|BL|DE|31|80|15
Sané|Leroy|AG|AD|Galatasaray|TSL|DE|30|81|20
Son|Heung-min|AG|BU|Los Angeles FC|MLS|KR|34|83|15
Mané|Sadio|AG|BU|Al-Nassr|SPL|SN|34|80|6
Coman|Kingsley|AG|AD|Al-Nassr|SPL|FR|30|80|20
Lookman|Ademola|AG|BU|Atalanta|SA|NG|28|84|45
Ezzalzouli|Abde|AG||Real Betis|LL|MA|24|80|30
Gittens|Jamie|AG||Chelsea|PL|EN|22|79|50
Garnacho|Alejandro|AG|AD|Chelsea|PL|AR|22|79|40
Rogers|Morgan|AG|MC|Aston Villa|PL|EN|24|83|70
Sancho|Jadon|AG|AD|Aston Villa|PL|EN|26|77|15
Baena|Álex|AG|MC|Atlético Madrid|LL|ES|25|83|50
Adeyemi|Karim|AG|BU|Borussia Dortmund|BL|DE|24|79|35
Tel|Mathys|AG|BU|Tottenham|PL|FR|21|76|30
Hudson-Odoi|Callum|AG|AD|Nottingham Forest|PL|EN|25|79|20
Ndiaye|Iliman|AG|AD|Everton|PL|SN|26|80|30
Ben Seghir|Eliesse|AG|MC|Bayer Leverkusen|BL|MA|21|77|25
Kebbal|Ilan|AG|MC|Paris FC|L1|DZ|28|76|8
Fati|Ansu|AG||AS Monaco|L1|ES|23|76|10
Fofana|Malick|AG|AD|Olympique Lyonnais|L1|BE|21|78|30
Mikautadze|Georges|AG|BU|Villarreal|LL|GE|25|78|25
Sulc|Pavel|AG|MC|Olympique Lyonnais|L1|CZ|25|76|10
Thauvin|Florian|AG|AD|RC Lens|L1|FR|33|76|3
Salah|Mohamed|AD||Liverpool|PL|EG|34|89|40
Yamal|Lamine|AD|AG|FC Barcelone|LL|ES|19|90|200
Saka|Bukayo|AD|AG|Arsenal|PL|EN|25|88|140
Madueke|Noni|AD|AG|Arsenal|PL|EN|24|80|45
Dembélé|Ousmane|AD|BU,AG|Paris Saint-Germain|L1|FR|29|90|80
Doué|Désiré|AD|AG|Paris Saint-Germain|L1|FR|21|85|90
Olise|Michael|AD|MC|Bayern Munich|BL|FR|24|87|110
Kudus|Mohammed|AD|MC|Tottenham|PL|GH|26|82|45
Kulusevski|Dejan|AD|MC|Tottenham|PL|SE|26|83|50
Mbeumo|Bryan|AD|BU|Manchester United|PL|CM|27|84|60
Diallo|Amad|AD||Manchester United|PL|CI|24|81|45
Neto|Pedro|AD|AG|Chelsea|PL|PT|26|82|50
Bowen|Jarrod|AD|BU|West Ham|PL|EN|29|82|40
Semenyo|Antoine|AD|AG|Bournemouth|PL|GH|26|82|65
Adli|Amine|AD|AG|Bournemouth|PL|MA|26|77|15
Elanga|Anthony|AD|AG|Newcastle|PL|SE|24|80|45
Sarr|Ismaïla|AD|AG|Crystal Palace|PL|SN|28|80|30
Kubo|Takefusa|AD||Real Sociedad|LL|JP|25|81|40
Rodrygo||AD|AG|Real Madrid|LL|BR|25|84|70
Díaz|Brahim|AD|MC|Real Madrid|LL|MA|26|81|30
Simeone|Giuliano|AD||Atlético Madrid|LL|AR|23|80|40
Politano|Matteo|AD||Naples|SA|IT|33|80|8
Pulisic|Christian|AD|AG|AC Milan|SA|US|28|84|45
Orsolini|Riccardo|AD||Bologne|SA|IT|29|81|25
Zhegrova|Edon|AD||Juventus|SA|XK|27|81|45
Greenwood|Mason|AD|BU|Olympique de Marseille|L1|JM|25|83|40
Akliouche|Maghnes|AD|MC|AS Monaco|L1|FR|24|80|40
Bakayoko|Johan|AD|AG|RB Leipzig|BL|BE|23|78|25
Sahraoui|Osame|AD||Lille OSC|L1|NO|24|76|10
Mbaye|Ibrahim|AD|AG|Paris Saint-Germain|L1|SN|18|72|15
Haraldsson|Hákon|AD|MC|Lille OSC|L1|NO|23|77|25
Mbappé|Kylian|BU|AG|Real Madrid|LL|FR|27|91|180
Haaland|Erling|BU||Manchester City|PL|NO|26|91|180
Kane|Harry|BU||Bayern Munich|BL|EN|33|90|65
Lewandowski|Robert|BU||FC Barcelone|LL|PL|38|84|8
Martínez|Lautaro|BU||Inter|SA|AR|29|88|85
Thuram|Marcus|BU|AG|Inter|SA|FR|29|85|70
Osimhen|Victor|BU||Galatasaray|TSL|NG|27|86|75
Isak|Alexander|BU||Liverpool|PL|SE|26|88|120
Ekitike|Hugo|BU|AG|Liverpool|PL|FR|24|84|80
Gyökeres|Viktor|BU||Arsenal|PL|SE|28|86|75
Álvarez|Julián|BU||Atlético Madrid|LL|AR|26|88|100
Sørloth|Alexander|BU||Atlético Madrid|LL|NO|30|82|20
Højlund|Rasmus|BU||Naples|SA|DK|23|80|45
Lukaku|Romelu|BU||Naples|SA|BE|33|81|10
Vlahović|Dušan|BU||Juventus|SA|RS|26|82|30
David|Jonathan|BU||Juventus|SA|CA|26|83|40
Openda|Loïs|BU|AG|Juventus|SA|BE|26|80|40
Šeško|Benjamin|BU||Manchester United|PL|SI|23|81|70
Watkins|Ollie|BU||Aston Villa|PL|EN|30|83|40
Jackson|Nicolas|BU||Bayern Munich|BL|SN|25|81|50
Delap|Liam|BU||Chelsea|PL|EN|23|79|40
Pedro|João|BU|MC|Chelsea|PL|BR|24|82|60
Guirassy|Serhou|BU||Borussia Dortmund|BL|GN|30|85|40
Woltemade|Nick|BU||Newcastle|PL|DE|24|81|65
Mateta|Jean-Philippe|BU||Crystal Palace|PL|FR|29|81|35
Wood|Chris|BU||Nottingham Forest|PL|NZ|34|80|12
Kalimuendo|Arnaud|BU||Nottingham Forest|PL|FR|24|77|25
Solanke|Dominic|BU||Tottenham|PL|EN|28|80|40
Kolo Muani|Randal|BU|AD|Tottenham|PL|FR|27|80|35
Ramos|Gonçalo|BU||Paris Saint-Germain|L1|PT|25|80|35
Retegui|Mateo|BU||Al-Qadsiah|SPL|IT|27|81|30
Kean|Moise|BU||Fiorentina|SA|IT|26|82|50
Ronaldo|Cristiano|BU||Al-Nassr|SPL|PT|41|82|12
Benzema|Karim|BU||Al-Ittihad|SPL|FR|38|83|8
Schick|Patrik|BU||Bayer Leverkusen|BL|CZ|30|81|20
Undav|Deniz|BU||VfB Stuttgart|BL|DE|30|80|25
Giménez|Santiago|BU||AC Milan|SA|MX|25|79|35
Pavlidis|Vangelis|BU||Benfica|LP|GR|27|81|30
Aghehowa|Samu|BU||FC Porto|LP|ES|22|80|50
Endrick||BU||Real Madrid|LL|BR|20|77|35
Wahi|Elye|BU||OGC Nice|L1|FR|23|76|15
Lepaul|Esteban|BU||Stade Rennais|L1|FR|26|76|15
Embolo|Breel|BU||Stade Rennais|L1|CH|29|77|10
Moffi|Terem|BU||OGC Nice|L1|NG|27|75|15
Abline|Matthis|BU|AG|FC Nantes|L1|FR|23|75|18
Ajorque|Ludovic|BU||Stade Brestois|L1|FR|32|74|3
Kroupi|Eli Junior|BU|AG|Bournemouth|PL|FR|20|74|20
Mohamed|Mostafa|BU||FC Nantes|L1|EG|28|73|6
`;
