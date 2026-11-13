export interface Category {
  id: string
  name: string
  emoji: string
  words: string[]
}

export const CATEGORIES: Category[] = [
  {
    id: 'streamerzy',
    name: 'Polscy Streamerzy i YouTuberzy',
    emoji: '🎥',
    words: [
      'Wardęga', 'Friz', 'Rafonix', 'Blowek', 'Kuba Klawiter', 'Kamerzysta', 'Gimper', 'Izak', 'Stuu', 'Budda',
      'Alan Aztec', 'Maffashion', 'Red Lipstick Monster', 'Ewa Chodakowska', 'Nervarien', 'Xayoo', 'Overpow', 'Jankos', 'Boxdel', 'Krzysztof Gonciarz',
      'Karol Paciorek', 'Marcin Dubiel', 'Fagata', 'Lil Masti', 'Julia Żugaj', 'Sylwia Przybysz', 'Dawid Podsiadło z Vlogów', 'Łukasz Jakóbiak', 'Anja Rubik', 'Michał Szpak',
      'Kuba Rzeźniczak', 'Mikołaj Rey', 'Gąska Balbinka', 'Pani Bożenka', 'Marcin Prokop', 'Bungee', 'Merghani', 'Dzinold', 'Bandura', 'Tuszol',
      'Pyka', 'Keacker', 'Szymon Majewski', 'Zbigniew Stonoga', 'Ibisz', 'Kuba Wojewódzki', 'Tomasz Kammel', 'Kuba Sienkiewicz', 'Kinga Rusin', 'Mateusz Damięcki',
      'Dziki z Pustyni', 'Michał Wiśniewski', 'Agnieszka Chylińska', 'Zenon z Akcentu', 'Paweł Deląg', 'Krzysztof Ibisz',
    ],
  },
  {
    id: 'rap',
    name: 'Polski Rap i Muzyka',
    emoji: '🎤',
    words: [
      'Quebonafide', 'Taco Hemingway', 'Mata', 'Bedoes', 'Sokół', 'Peja', 'Pezet', 'Białas', 'Paluch', 'Szpaku',
      'Young Multi', 'Sentino', 'Otsochodzi', 'Oki', 'Kizo', 'Tede', 'O.S.T.R.', 'Liroy', 'Kaz Bałagane', 'Malik Montana',
      'Gedz', 'Smolasty', 'Doda', 'Margaret', 'Sanah', 'Dawid Podsiadło', 'Maryla Rodowicz', 'Zenek Martyniuk', 'Sławomir', 'Krzysztof Krawczyk',
      'Czesław Niemen', 'Kazik Staszewski', 'Mrozu', 'Natalia Nykiel', 'Vito Bambino', 'Dua Lipa', 'Eminem', 'Kanye West', 'Drake', 'Snoop Dogg',
      '2Pac', 'The Weeknd', 'Travis Scott', 'Bad Bunny', 'Rihanna', 'Beyoncé', 'Ed Sheeran', 'Michael Jackson', 'Freddie Mercury', 'Elvis Presley',
      'Taylor Swift', 'Ariana Grande', 'Justin Bieber', 'Billie Eilish', 'Shakira', 'Lady Gaga', 'Fisz', 'Mes',
    ],
  },
  {
    id: 'memy',
    name: 'Memy i Klasyki Internetu',
    emoji: '😂',
    words: [
      'Doge', 'Pepe the Frog', 'Nyan Cat', 'Rick Astley', 'Grumpy Cat', 'Trollface', 'Wojak', 'Gigachad', 'Shrek', 'Karyna',
      'Sebix', 'Janusz Biznesu', 'Brajan', 'Grażyna', 'Cebulak', 'Kermit', 'Success Kid', 'Bad Luck Brian', 'Chłopak patrzący na inną dziewczynę', 'Zaskoczony Pikachu',
      'Harold Ukrywający Ból', 'Keyboard Cat', 'Gangnam Style', 'Baby Yoda', 'Among Us', 'Chuck Norris', 'Książę z Nigerii', 'Leeroy Jenkins', 'Skibidi Toilet', 'Sigma',
      'Creeper', 'Ciasteczkowy Potwór', 'Pan Kleks', 'Ten Typ Mentzen', 'Polak Potrafi', 'Lewandowski na Instagramie', 'Kot Behemot', 'Ogórek Rick', 'Jajco Dwa Wesela', 'Dobra Nasza Panie Kierowniku',
      'Kto pyta', 'Ratio', 'Rozbiorowy kot', 'Sad Affleck', 'Kaczuszka do kąpieli', 'Pan Jeż', 'Tańczący Banan', 'Pedro Pedro Pedro', 'Hamster Kombat', 'Skrzat z Reklamy',
      'Dancing Baby', 'Ice Bucket Challenge', 'Planking', 'Alex z Lidla', 'Baba Jaga z Zakopanego', 'Swiper No Swiping', 'Kaktus Czesław', 'Drake Hotline Bling',
    ],
  },
  {
    id: 'historia',
    name: 'Postacie Historyczne i Polityka',
    emoji: '🏛️',
    words: [
      'Mieszko I', 'Bolesław Chrobry', 'Kazimierz Wielki', 'Władysław Jagiełło', 'Królowa Jadwiga', 'Mikołaj Kopernik', 'Jan III Sobieski', 'Tadeusz Kościuszko', 'Józef Piłsudski', 'Lech Wałęsa',
      'Jan Paweł II', 'Maria Skłodowska-Curie', 'Fryderyk Chopin', 'Adam Mickiewicz', 'Napoleon Bonaparte', 'Juliusz Cezar', 'Kleopatra', 'Aleksander Wielki', 'Leonardo da Vinci', 'Albert Einstein',
      'Winston Churchill', 'Abraham Lincoln', 'Margaret Thatcher', 'Mahatma Gandhi', 'Martin Luther King', 'Nikola Tesla', 'Isaac Newton', 'Galileusz', 'Krzysztof Kolumb', 'Witold Pilecki',
      'Irena Sendlerowa', 'Roman Dmowski', 'Stefan Batory', 'Bolesław Krzywousty', 'Kazimierz Pułaski', 'Wojciech Jaruzelski', 'Donald Tusk', 'Andrzej Duda', 'Jarosław Kaczyński', 'Donald Trump',
      'Barack Obama', 'Angela Merkel', 'Janusz Korwin-Mikke', 'Lech Kaczyński', 'Aleksander Kwaśniewski', 'Szymon Hołownia', 'Sławomir Mentzen', 'Karol Nawrocki', 'Rafał Trzaskowski', 'Mateusz Morawiecki',
      'Lech Bądkowski', 'Ludwik Zamenhof', 'Henryk Sienkiewicz', 'Zygmunt Stary', 'Stanisław August Poniatowski', 'Ignacy Jan Paderewski', 'Jan Matejko', 'Wisława Szymborska',
    ],
  },
  {
    id: 'sport',
    name: 'Sportowcy i Celebryci',
    emoji: '🏆',
    words: [
      'Robert Lewandowski', 'Iga Świątek', 'Adam Małysz', 'Kamil Stoch', 'Wojciech Szczęsny', 'Zbigniew Boniek', 'Jerzy Dudek', 'Cristiano Ronaldo', 'Lionel Messi', 'Neymar',
      'Kylian Mbappé', 'Erling Haaland', 'LeBron James', 'Michael Jordan', 'Usain Bolt', 'Serena Williams', 'Roger Federer', 'Novak Djoković', 'Mike Tyson', 'Conor McGregor',
      'Mariusz Pudzianowski', 'Tomasz Adamek', 'Artur Szpilka', 'Anita Włodarczyk', 'Justyna Kowalczyk', 'Otylia Jędrzejczak', 'Robert Kubica', 'Agnieszka Radwańska', 'Piotr Zieliński', 'Jan Błachowicz',
      'Joanna Jędrzejczyk', 'Kuba Błaszczykowski', 'Piotr Żyła', 'Dawid Kubacki', 'Kim Kardashian', 'Elon Musk', 'Mark Zuckerberg', 'Kuba Sienkiewicz z TV', 'Małgorzata Rozenek', 'Magda Gessler',
      'Cezary Pazura', 'Bogusław Linda', 'Borys Szyc', 'Joanna Krupa', 'Anna Lewandowska', 'Marcin Gortat', 'Mateusz Borek', 'Krzysztof Stanowski', 'Michał Probierz', 'Lewis Hamilton',
      'Max Verstappen', 'Tiger Woods', 'Floyd Mayweather', 'Zlatan Ibrahimović', 'Diego Maradona', 'Pelé', 'David Beckham', 'Kevin De Bruyne',
    ],
  },
  {
    id: 'popkultura',
    name: 'Filmy, Gry i Popkultura',
    emoji: '🎬',
    words: [
      'Harry Potter', 'Geralt z Rivii', 'Ferdynand Kiepski', 'Reksio', 'Bolek i Lolek', 'Krecik', 'Kargul', 'Pawlak', 'Super Mario', 'Luigi',
      'Sonic', 'Pikachu', 'Link z Zeldy', 'Lara Croft', 'Kratos', 'Master Chief', 'Darth Vader', 'Yoda', 'Luke Skywalker', 'Batman',
      'Spider-Man', 'Iron Man', 'Thanos', 'Joker', 'Gandalf', 'Frodo', 'Hermiona Granger', 'Jack Sparrow', 'Terminator', 'Forrest Gump',
      'Simba', 'Elsa z Krainy Lodu', 'Johnny Silverhand', 'Minecraft Steve', 'Kubuś Puchatek', 'Fiona z bagna', 'Osioł ze Shreka', 'Homer Simpson', 'SpongeBob', 'Patryk Rozgwiazda',
      'Rick Sanchez', 'Walter White', 'Daenerys Targaryen', 'Jon Snow', 'Sherlock Holmes', 'James Bond', 'Indiana Jones', 'Kapitan Bomba', 'Pan Samochodzik', 'Franek Kimono',
      'Mario Kart', 'Fortnite Peely', 'Zelda', 'Wiedźmin Vesemir', 'Pudzian z Kiepskich', 'Mufasa', 'Stuart Little', 'Obi-Wan Kenobi', 'Ciri',
    ],
  },
]

export const OWN_CATEGORY = 'Własne hasło'

export const ALL_CATEGORY_IDS = CATEGORIES.map((c) => c.id)

export function categoryName(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.name ?? OWN_CATEGORY
}
