"use strict";

const CATEGORIES = {
  science: { label: "Наука", color: "#6cae95" },
  philosophy: { label: "Философия", color: "#c79743" },
  politics: { label: "Политика", color: "#d87a53" },
  art: { label: "Искусство", color: "#8d9cd6" },
  exploration: { label: "Исследования и космос", color: "#58a0b4" },
  technology: { label: "Технологии", color: "#9a8bb7" },
  psychology: { label: "Психология", color: "#b9866a" }
};

const PEOPLE = [
  {
    id: "confucius",
    name: "Конфуций",
    category: "philosophy",
    birthYear: -551,
    deathYear: -479,
    birthDate: "551 до н.э.",
    deathDate: "479 до н.э.",
    summary: "Китайский мыслитель, чьи идеи стали основой конфуцианской этики и модели государственного управления.",
    achievements: ["Сформировал этическую систему, повлиявшую на культуру Восточной Азии.", "Подчеркнул ценность образования, долга и социальной ответственности."]
  },
  {
    id: "aristotle",
    name: "Аристотель",
    category: "science",
    birthYear: -384,
    deathYear: -322,
    birthDate: "384 до н.э.",
    deathDate: "322 до н.э.",
    summary: "Древнегреческий философ и исследователь, работавший в логике, биологии, физике и политике.",
    achievements: ["Заложил основы формальной логики.", "Систематизировал знания о природе и обществе, повлияв на развитие науки в Европе и арабском мире."]
  },
  {
    id: "archimedes",
    name: "Архимед",
    category: "science",
    birthYear: -287,
    deathYear: -212,
    birthDate: "287 до н.э.",
    deathDate: "212 до н.э.",
    summary: "Математик, инженер и физик античности, один из важнейших ученых древнего мира.",
    achievements: ["Сформулировал закон гидростатики (закон Архимеда).", "Развивал методы вычисления площадей и объемов, предвосхитив элементы интегрального исчисления."]
  },
  {
    id: "cleopatra",
    name: "Клеопатра VII",
    category: "politics",
    birthYear: -69,
    deathYear: -30,
    birthDate: "69 до н.э.",
    deathDate: "30 до н.э.",
    summary: "Последняя правительница эллинистического Египта, влиятельная политическая фигура Средиземноморья.",
    achievements: ["Пыталась сохранить независимость Египта в эпоху расширения Рима.", "Стала символом дипломатии и политической стратегии античного мира."]
  },
  {
    id: "hypatia",
    name: "Гипатия Александрийская",
    category: "science",
    birthYear: 355,
    deathYear: 415,
    birthDate: "ок. 355",
    deathDate: "415",
    summary: "Философ, математик и астроном поздней античности, преподаватель Александрийской школы.",
    achievements: ["Популяризировала математику и астрономию в Александрии.", "Стала историческим символом научного знания и академической свободы."]
  },
  {
    id: "al-khwarizmi",
    name: "Мухаммад аль-Хорезми",
    category: "science",
    birthYear: 780,
    deathYear: 850,
    birthDate: "ок. 780",
    deathDate: "ок. 850",
    summary: "Математик и астроном, чьи труды заложили основы алгебры в средневековой науке.",
    achievements: ["Систематизировал методы решения уравнений в трактате по алгебре.", "Через латинские переводы повлиял на развитие европейской математики."]
  },
  {
    id: "avicenna",
    name: "Ибн Сина (Авиценна)",
    category: "science",
    birthYear: 980,
    deathYear: 1037,
    birthDate: "980",
    deathDate: "1037",
    summary: "Философ и врач, автор фундаментальных трудов по медицине и естествознанию.",
    achievements: ["Создал «Канон врачебной науки», ключевой медицинский текст на века.", "Синтезировал философские и научные знания исламского Золотого века."]
  },
  {
    id: "leonardo",
    name: "Леонардо да Винчи",
    category: "art",
    birthYear: 1452,
    deathYear: 1519,
    birthDate: "1452",
    deathDate: "1519",
    summary: "Художник и инженер эпохи Возрождения, сочетавший искусство с научным подходом.",
    achievements: ["Создал картины «Мона Лиза» и «Тайная вечеря».", "Оставил инженерные и анатомические эскизы, опередившие свое время."]
  },
  {
    id: "copernicus",
    name: "Николай Коперник",
    category: "science",
    birthYear: 1473,
    deathYear: 1543,
    birthDate: "1473",
    deathDate: "1543",
    summary: "Астроном, предложивший гелиоцентрическую модель мира.",
    achievements: ["Сформулировал концепцию движения планет вокруг Солнца.", "Запустил научную революцию в астрономии и физике."]
  },
  {
    id: "michelangelo",
    name: "Микеланджело Буонарроти",
    category: "art",
    birthYear: 1475,
    deathYear: 1564,
    birthDate: "1475",
    deathDate: "1564",
    summary: "Скульптор, художник и архитектор Высокого Возрождения.",
    achievements: ["Создал скульптуры «Давид» и «Пьета».", "Расписал свод Сикстинской капеллы."]
  },
  {
    id: "galileo",
    name: "Галилео Галилей",
    category: "science",
    birthYear: 1564,
    deathYear: 1642,
    birthDate: "1564",
    deathDate: "1642",
    summary: "Физик и астроном, один из ключевых авторов научного метода Нового времени.",
    achievements: ["Улучшил телескоп и наблюдал спутники Юпитера.", "Поддержал гелиоцентризм и развивал экспериментальную физику."]
  },
  {
    id: "kepler",
    name: "Иоганн Кеплер",
    category: "science",
    birthYear: 1571,
    deathYear: 1630,
    birthDate: "1571",
    deathDate: "1630",
    summary: "Астроном и математик, описавший законы движения планет.",
    achievements: ["Сформулировал три закона движения планет.", "Показал, что орбиты планет эллиптические, а не круговые."]
  },
  {
    id: "shakespeare",
    name: "Уильям Шекспир",
    category: "art",
    birthYear: 1564,
    deathYear: 1616,
    birthDate: "1564",
    deathDate: "1616",
    summary: "Драматург и поэт, оказавший фундаментальное влияние на мировую литературу.",
    achievements: ["Написал трагедии «Гамлет», «Отелло», «Король Лир».", "Сформировал стандарты английской драматургии и театра."]
  },
  {
    id: "newton",
    name: "Исаак Ньютон",
    category: "science",
    birthYear: 1643,
    deathYear: 1727,
    birthDate: "1643",
    deathDate: "1727",
    summary: "Физик и математик, создавший фундамент классической механики.",
    achievements: ["Сформулировал законы движения и закон всемирного тяготения.", "Совместно с Лейбницем заложил основы математического анализа."]
  },
  {
    id: "peter-great",
    name: "Пётр I",
    category: "politics",
    birthYear: 1672,
    deathYear: 1725,
    birthDate: "1672",
    deathDate: "1725",
    summary: "Российский император, проведший масштабные государственные реформы.",
    achievements: ["Модернизировал армию, флот и административную систему.", "Основал Санкт-Петербург и расширил международные связи государства."]
  },
  {
    id: "linnaeus",
    name: "Карл Линней",
    category: "science",
    birthYear: 1707,
    deathYear: 1778,
    birthDate: "1707",
    deathDate: "1778",
    summary: "Натуралист, систематизировавший классификацию живых организмов.",
    achievements: ["Ввел биномиальную номенклатуру в биологии.", "Создал единую схему описания видов, используемую до сих пор."]
  },
  {
    id: "catherine-ii",
    name: "Екатерина II",
    category: "politics",
    birthYear: 1729,
    deathYear: 1796,
    birthDate: "1729",
    deathDate: "1796",
    summary: "Российская императрица эпохи Просвещения.",
    achievements: ["Расширила территорию и международное влияние Российской империи.", "Поддерживала проекты образования, науки и культуры."]
  },
  {
    id: "cook",
    name: "Джеймс Кук",
    category: "exploration",
    birthYear: 1728,
    deathYear: 1779,
    birthDate: "1728",
    deathDate: "1779",
    summary: "Мореплаватель и картограф, исследователь Тихого океана.",
    achievements: ["Провел три крупные кругосветные экспедиции.", "Составил точные карты Новой Зеландии и восточного побережья Австралии."]
  },
  {
    id: "mozart",
    name: "Вольфганг Амадей Моцарт",
    category: "art",
    birthYear: 1756,
    deathYear: 1791,
    birthDate: "1756",
    deathDate: "1791",
    summary: "Композитор-классик, один из самых влиятельных авторов в истории музыки.",
    achievements: ["Создал более 600 произведений в разных жанрах.", "Стал символом венской классической школы."]
  },
  {
    id: "napoleon",
    name: "Наполеон Бонапарт",
    category: "politics",
    birthYear: 1769,
    deathYear: 1821,
    birthDate: "1769",
    deathDate: "1821",
    summary: "Французский государственный деятель и военный лидер.",
    achievements: ["Реформировал право и администрацию (Кодекс Наполеона).", "Существенно повлиял на политическую карту Европы XIX века."]
  },
  {
    id: "darwin",
    name: "Чарлз Дарвин",
    category: "science",
    birthYear: 1809,
    deathYear: 1882,
    birthDate: "1809",
    deathDate: "1882",
    summary: "Натуралист, разработавший теорию эволюции через естественный отбор.",
    achievements: ["Опубликовал «Происхождение видов».", "Изменил биологическую картину происхождения и развития жизни."]
  },
  {
    id: "lincoln",
    name: "Авраам Линкольн",
    category: "politics",
    birthYear: 1809,
    deathYear: 1865,
    birthDate: "1809",
    deathDate: "1865",
    summary: "16-й президент США в период Гражданской войны.",
    achievements: ["Сохранил единство страны в критический период.", "Подписал Прокламацию об освобождении рабов."]
  },
  {
    id: "lovelace",
    name: "Ада Лавлейс",
    category: "technology",
    birthYear: 1815,
    deathYear: 1852,
    birthDate: "1815",
    deathDate: "1852",
    summary: "Математик, считающаяся одним из первых теоретиков программирования.",
    achievements: ["Описала алгоритм для аналитической машины Бэббиджа.", "Показала, что вычислительные машины могут решать широкий класс задач."]
  },
  {
    id: "tolstoy",
    name: "Лев Толстой",
    category: "art",
    birthYear: 1828,
    deathYear: 1910,
    birthDate: "1828",
    deathDate: "1910",
    summary: "Писатель и мыслитель, классик мировой литературы.",
    achievements: ["Создал романы «Война и мир» и «Анна Каренина».", "Сильно повлиял на философию ненасилия и гуманистическую мысль."]
  },
  {
    id: "mendeleev",
    name: "Дмитрий Менделеев",
    category: "science",
    birthYear: 1834,
    deathYear: 1907,
    birthDate: "1834",
    deathDate: "1907",
    summary: "Химик, сформулировавший периодический закон.",
    achievements: ["Создал периодическую таблицу химических элементов.", "Предсказал свойства еще не открытых элементов."]
  },
  {
    id: "van-gogh",
    name: "Винсент ван Гог",
    category: "art",
    birthYear: 1853,
    deathYear: 1890,
    birthDate: "1853",
    deathDate: "1890",
    summary: "Художник-постимпрессионист, оказавший глубокое влияние на искусство XX века.",
    achievements: ["Создал работы «Звездная ночь» и «Подсолнухи».", "Развил выразительный стиль цвета и мазка."]
  },
  {
    id: "tesla",
    name: "Никола Тесла",
    category: "science",
    birthYear: 1856,
    deathYear: 1943,
    birthDate: "1856",
    deathDate: "1943",
    summary: "Инженер и изобретатель, внесший крупный вклад в электроэнергетику.",
    achievements: ["Развивал системы переменного тока и электродвигатели.", "Предложил и испытал множество идей беспроводной передачи энергии."]
  },
  {
    id: "curie",
    name: "Мария Склодовская-Кюри",
    category: "science",
    birthYear: 1867,
    deathYear: 1934,
    birthDate: "1867",
    deathDate: "1934",
    summary: "Физик и химик, пионер исследований радиоактивности.",
    achievements: ["Первая женщина - лауреат Нобелевской премии.", "Единственный ученый, получивший Нобелевскую премию в двух разных науках."]
  },
  {
    id: "gandhi",
    name: "Махатма Ганди",
    category: "politics",
    birthYear: 1869,
    deathYear: 1948,
    birthDate: "1869",
    deathDate: "1948",
    summary: "Политический и общественный лидер борьбы за независимость Индии.",
    achievements: ["Развивал стратегию ненасильственного сопротивления.", "Вдохновил глобальные гражданские движения XX века."]
  },
  {
    id: "churchill",
    name: "Уинстон Черчилль",
    category: "politics",
    birthYear: 1874,
    deathYear: 1965,
    birthDate: "1874",
    deathDate: "1965",
    summary: "Британский политик, премьер-министр в годы Второй мировой войны.",
    achievements: ["Руководил страной в период одного из крупнейших глобальных конфликтов.", "Влиял на послевоенное устройство Европы."]
  },
  {
    id: "einstein",
    name: "Альберт Эйнштейн",
    category: "science",
    birthYear: 1879,
    deathYear: 1955,
    birthDate: "1879",
    deathDate: "1955",
    summary: "Физик-теоретик, автор специальной и общей теории относительности.",
    achievements: ["Объяснил фотоэффект (Нобелевская премия 1921).", "Изменил представления о пространстве, времени и гравитации."]
  },
  {
    id: "picasso",
    name: "Пабло Пикассо",
    category: "art",
    birthYear: 1881,
    deathYear: 1973,
    birthDate: "1881",
    deathDate: "1973",
    summary: "Художник и скульптор, один из основателей кубизма.",
    achievements: ["Радикально переосмыслил язык живописи XX века.", "Создал «Гернику», ставшую символом антивоенного искусства."]
  },
  {
    id: "korolev",
    name: "Сергей Королёв",
    category: "exploration",
    birthYear: 1907,
    deathYear: 1966,
    birthDate: "1907",
    deathDate: "1966",
    summary: "Инженер и главный конструктор советской космической программы.",
    achievements: ["Руководил запуском первого искусственного спутника Земли.", "Сделал возможным первый полет человека в космос."]
  },
  {
    id: "turing",
    name: "Алан Тьюринг",
    category: "technology",
    birthYear: 1912,
    deathYear: 1954,
    birthDate: "1912",
    deathDate: "1954",
    summary: "Математик и логик, один из основателей информатики.",
    achievements: ["Предложил абстрактную модель вычислений (машина Тьюринга).", "Участвовал во взломе шифров Enigma во время Второй мировой войны."]
  },
  {
    id: "mandela",
    name: "Нельсон Мандела",
    category: "politics",
    birthYear: 1918,
    deathYear: 2013,
    birthDate: "1918",
    deathDate: "2013",
    summary: "Политический лидер ЮАР, символ борьбы против апартеида.",
    achievements: ["Стал первым чернокожим президентом Южной Африки.", "Продвигал национальное примирение и правовое равенство."]
  },
  {
    id: "mlk",
    name: "Мартин Лютер Кинг-младший",
    category: "politics",
    birthYear: 1929,
    deathYear: 1968,
    birthDate: "1929",
    deathDate: "1968",
    summary: "Лидер движения за гражданские права в США.",
    achievements: ["Продвигал ненасильственные методы политической борьбы.", "Речь «I Have a Dream» стала символом борьбы за равные права."]
  },
  {
    id: "gorbachev",
    name: "Михаил Горбачёв",
    category: "politics",
    birthYear: 1931,
    deathYear: 2022,
    birthDate: "1931",
    deathDate: "2022",
    summary: "Государственный деятель, последний руководитель СССР.",
    achievements: ["Инициировал реформы перестройки и гласности.", "Сыграл ключевую роль в завершении холодной войны."]
  },
  {
    id: "gagarin",
    name: "Юрий Гагарин",
    category: "exploration",
    birthYear: 1934,
    deathYear: 1968,
    birthDate: "1934",
    deathDate: "1968",
    summary: "Космонавт, совершивший первый полет человека в космос.",
    achievements: ["12 апреля 1961 года открыл эру пилотируемой космонавтики.", "Стал международным символом научно-технического прорыва."]
  },
  {
    id: "thatcher",
    name: "Маргарет Тэтчер",
    category: "politics",
    birthYear: 1925,
    deathYear: 2013,
    birthDate: "1925",
    deathDate: "2013",
    summary: "Премьер-министр Великобритании, определившая курс страны в конце XX века.",
    achievements: ["Первая женщина на посту премьер-министра Великобритании.", "Провела масштабные экономические реформы и приватизацию."]
  },
  {
    id: "frida",
    name: "Фрида Кало",
    category: "art",
    birthYear: 1907,
    deathYear: 1954,
    birthDate: "1907",
    deathDate: "1954",
    summary: "Мексиканская художница, чьи автопортреты стали знаковыми для мирового искусства.",
    achievements: ["Сформировала узнаваемый авторский стиль, сочетая реализм и символизм.", "Стала культурным символом личной и художественной свободы."]
  },
  {
    id: "jobs",
    name: "Стив Джобс",
    category: "technology",
    birthYear: 1955,
    deathYear: 2011,
    birthDate: "1955",
    deathDate: "2011",
    summary: "Предприниматель и визионер в сфере персональных технологий.",
    achievements: ["Участвовал в создании Apple и развитии массового персонального компьютера.", "Запустил продукты, которые изменили рынок мобильных устройств и цифровых медиа."]
  },
  {
    id: "hawking",
    name: "Стивен Хокинг",
    category: "science",
    birthYear: 1942,
    deathYear: 2018,
    birthDate: "1942",
    deathDate: "2018",
    summary: "Физик-теоретик, исследователь черных дыр и космологии.",
    achievements: ["Разработал идеи об испарении черных дыр (излучение Хокинга).", "Сделал сложную науку доступной широкой аудитории."]
  },
  {
    id: "elizabeth-ii",
    name: "Елизавета II",
    category: "politics",
    birthYear: 1926,
    deathYear: 2022,
    birthDate: "1926",
    deathDate: "2022",
    summary: "Королева Великобритании, один из самых долгоправящих монархов в истории.",
    achievements: ["Символизировала институциональную стабильность в период мировых изменений.", "Сопровождала переход Британии через несколько политических эпох."]
  },
  {
    id: "pavlov",
    name: "Иван Павлов",
    wikiTitle: "Павлов, Иван Петрович",
    category: "psychology",
    birthYear: 1849,
    deathYear: 1936,
    birthDate: "1849",
    deathDate: "1936",
    summary: "Физиолог и психолог, исследователь высшей нервной деятельности.",
    achievements: ["Разработал теорию условных рефлексов.", "Создал экспериментальную базу для изучения поведения и обучения."]
  },
  {
    id: "freud",
    name: "Зигмунд Фрейд",
    wikiTitle: "Фрейд, Зигмунд",
    category: "psychology",
    birthYear: 1856,
    deathYear: 1939,
    birthDate: "1856",
    deathDate: "1939",
    summary: "Невролог и психиатр, основатель психоанализа.",
    achievements: ["Предложил структурную модель психики и понятие бессознательного.", "Сформировал психоаналитический подход к психотерапии."]
  },
  {
    id: "adler",
    name: "Альфред Адлер",
    wikiTitle: "Адлер, Альфред",
    category: "psychology",
    birthYear: 1870,
    deathYear: 1937,
    birthDate: "1870",
    deathDate: "1937",
    summary: "Психолог и психиатр, основатель индивидуальной психологии.",
    achievements: ["Развивал идеи о стремлении к значимости и компенсации.", "Подчеркнул роль социального контекста в развитии личности."]
  },
  {
    id: "vygotsky",
    name: "Лев Выготский",
    wikiTitle: "Выготский, Лев Семёнович",
    category: "psychology",
    birthYear: 1896,
    deathYear: 1934,
    birthDate: "1896",
    deathDate: "1934",
    summary: "Психолог, один из ключевых авторов культурно-исторической теории развития.",
    achievements: ["Сформулировал концепцию зоны ближайшего развития.", "Показал фундаментальную роль речи и культуры в формировании мышления."]
  },
  {
    id: "luria",
    name: "Александр Лурия",
    wikiTitle: "Лурия, Александр Романович",
    category: "psychology",
    birthYear: 1902,
    deathYear: 1977,
    birthDate: "1902",
    deathDate: "1977",
    summary: "Психолог и нейропсихолог, один из основателей советской нейропсихологии.",
    achievements: ["Связал клинические наблюдения с функциональной организацией мозга.", "Разработал методы нейропсихологической диагностики."]
  },
  {
    id: "leontiev",
    name: "Алексей Леонтьев",
    wikiTitle: "Леонтьев, Алексей Николаевич",
    category: "psychology",
    birthYear: 1903,
    deathYear: 1979,
    birthDate: "1903",
    deathDate: "1979",
    summary: "Психолог, развивавший деятельностный подход в отечественной науке.",
    achievements: ["Сформулировал теорию деятельности и структуру мотивации.", "Развил идеи о связи сознания с практической деятельностью человека."]
  },
  {
    id: "berne",
    name: "Эрик Берн",
    wikiTitle: "Берн, Эрик",
    category: "psychology",
    birthYear: 1910,
    deathYear: 1970,
    birthDate: "1910",
    deathDate: "1970",
    summary: "Психиатр и психолог, создатель транзактного анализа.",
    achievements: ["Описал эго-состояния Родитель, Взрослый и Ребенок.", "Популяризировал психологию общения через понятие жизненных сценариев."]
  },
  {
    id: "gippenreiter",
    name: "Юлия Гиппенрейтер",
    wikiTitle: "Гиппенрейтер, Юлия Борисовна",
    category: "psychology",
    birthYear: 1930,
    deathYear: new Date().getFullYear(),
    birthDate: "1930",
    deathDate: "по н.в.",
    summary: "Психолог, педагог и автор популярных трудов по детско-родительскому общению.",
    achievements: ["Внесла значительный вклад в развитие психологической практики в образовании.", "Сделала идеи гуманистического общения доступными для широкой аудитории."]
  }
];

const SEARCH_INPUT = document.querySelector("#search-input");
const RESULTS_COUNT = document.querySelector("#results-count");
const AXIS = document.querySelector("#timeline-axis");
const LANES = document.querySelector("#timeline-lanes");
const DETAILS = document.querySelector("#person-details");
const LEGEND = document.querySelector("#legend");
const TIMELINE_READOUT = document.querySelector("#timeline-readout");
const DATA_SOURCE_NOTE = document.querySelector("#data-source-note");
const VIEWPORT = document.querySelector("#timeline-viewport");
const ERA_PILLS = document.querySelector("#era-pills");
const ZOOM_RANGE = document.querySelector("#zoom-range");
const PARALLAX_LAYERS = Array.from(document.querySelectorAll(".parallax-layer"));
const dataService = window.TimelineDataService || null;

const BASE_ROW_HEIGHT = 56;
const ROW_GAP_PX = 10;
const MIN_BAR_PX = 86;
const AXIS_PADDING_X = 56;
const ACTIVE_SEGMENT_JOIN_YEARS = 34;
const GAP_COMPRESSION_BASE = 0.22;
const WIKI_API_URL = "https://ru.wikipedia.org/w/api.php";
const PORTRAIT_SIZE = 200;
const portraitCache = new Map();
const REDUCE_MOTION_MEDIA = window.matchMedia("(prefers-reduced-motion: reduce)");
const HAS_HOVER_MEDIA = window.matchMedia("(hover: hover)");

const state = {
  people: [...PEOPLE],
  query: "",
  category: "all",
  selectedId: null,
  detailsRequestId: 0,
  zoom: Number(ZOOM_RANGE?.value ?? 140),
  filteredPeople: [],
  layoutMetrics: null,
  dataSource: "seed"
};

const ERAS = [
  { id: "ancient", label: "Античность", year: -500 },
  { id: "middle-ages", label: "Средневековье", year: 900 },
  { id: "renaissance", label: "Возрождение", year: 1500 },
  { id: "modern", label: "Новое время", year: 1800 },
  { id: "twentieth", label: "XX век", year: 1930 },
  { id: "today", label: "Современность", year: 2005 }
];

function shouldReduceMotion() {
  return REDUCE_MOTION_MEDIA.matches;
}

function formatYear(year) {
  return year < 0 ? `${Math.abs(year)} до н.э.` : `${year}`;
}

function formatPersonYears(person) {
  if (person.deathDate === "по н.в.") {
    return `${formatYear(person.birthYear)} - по н.в.`;
  }
  return `${formatYear(person.birthYear)} - ${formatYear(person.deathYear)}`;
}

function chooseTickStep(pxPerYear) {
  const steps = [5, 10, 25, 50, 100, 200, 500];
  for (const step of steps) {
    if (step * pxPerYear >= 76) {
      return step;
    }
  }
  return 500;
}

function renderLegend() {
  if (!LEGEND) return;

  LEGEND.innerHTML = "";
  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "legend-item legend-button";
  allButton.dataset.category = "all";
  allButton.textContent = "Все категории";
  allButton.addEventListener("click", () => {
    state.category = "all";
    render();
  });
  LEGEND.append(allButton);

  Object.entries(CATEGORIES).forEach(([key, category]) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "legend-item legend-button";
    item.dataset.category = key;
    item.addEventListener("click", () => {
      state.category = key;
      render();
    });

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.background = category.color;
    swatch.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.textContent = category.label;

    item.append(swatch, text);
    LEGEND.append(item);
  });

  updateCategoryButtonsState();
}

function updateCategoryButtonsState() {
  const buttons = LEGEND?.querySelectorAll(".legend-button") ?? [];
  buttons.forEach((button) => {
    const isActive = button.dataset.category === state.category;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderEraPills() {
  ERA_PILLS.innerHTML = "";
  for (const era of ERAS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "era-pill";
    button.dataset.year = String(era.year);
    button.textContent = era.label;
    button.addEventListener("click", () => {
      jumpToYear(era.year);
      setActiveEraPill(era.id);
    });
    button.dataset.era = era.id;
    ERA_PILLS.append(button);
  }
}

function setActiveEraPill(id) {
  const pills = ERA_PILLS.querySelectorAll(".era-pill");
  pills.forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.era === id);
  });
}

function getFilteredPeople() {
  const query = state.query.trim().toLowerCase();

  return state.people.filter((person) => {
    const categoryMatch = state.category === "all" || person.category === state.category;
    if (!categoryMatch) return false;
    if (!query) return true;

    const blob = [person.name, person.summary, person.achievements.join(" ")]
      .join(" ")
      .toLowerCase();

    return blob.includes(query);
  }).sort((a, b) => a.birthYear - b.birthYear);
}

function buildActiveSegments(people) {
  const sorted = [...people].sort((a, b) => a.birthYear - b.birthYear);
  const segments = [];
  let current = {
    start: sorted[0].birthYear,
    end: sorted[0].deathYear
  };

  for (let index = 1; index < sorted.length; index += 1) {
    const person = sorted[index];
    if (person.birthYear <= current.end + ACTIVE_SEGMENT_JOIN_YEARS) {
      current.end = Math.max(current.end, person.deathYear);
      continue;
    }

    segments.push(current);
    current = { start: person.birthYear, end: person.deathYear };
  }

  segments.push(current);
  return segments;
}

function buildTimelineMetrics(people) {
  if (!people.length) return null;

  const minYear = Math.min(...people.map((person) => person.birthYear));
  const maxYear = Math.max(...people.map((person) => person.deathYear));
  const yearRange = Math.max(1, maxYear - minYear);

  const viewportWidth = Math.max(760, VIEWPORT.clientWidth || 760);
  const zoomFactor = Math.max(0.74, state.zoom / 140);
  const densityPerCentury = people.length / Math.max(1, yearRange / 100);
  const activeRateRaw = (1.14 * zoomFactor) * Math.min(1.58, 0.9 + Math.sqrt(densityPerCentury) * 0.17);
  const gapRateRaw = activeRateRaw * Math.min(0.36, GAP_COMPRESSION_BASE + densityPerCentury * 0.01);

  const segments = buildActiveSegments(people);
  const rawPieces = [];
  let cursorYear = minYear;
  let cursorX = 0;

  for (const segment of segments) {
    const segmentStart = Math.max(minYear, segment.start);
    const segmentEnd = Math.min(maxYear, segment.end);

    if (segmentStart > cursorYear) {
      const gapLength = segmentStart - cursorYear;
      const gapWidth = gapLength * gapRateRaw;
      rawPieces.push({
        type: "gap",
        startYear: cursorYear,
        endYear: segmentStart,
        rate: gapRateRaw,
        startX: cursorX,
        endX: cursorX + gapWidth
      });
      cursorX += gapWidth;
      cursorYear = segmentStart;
    }

    if (segmentEnd > cursorYear) {
      const activeLength = segmentEnd - cursorYear;
      const activeWidth = activeLength * activeRateRaw;
      rawPieces.push({
        type: "active",
        startYear: cursorYear,
        endYear: segmentEnd,
        rate: activeRateRaw,
        startX: cursorX,
        endX: cursorX + activeWidth
      });
      cursorX += activeWidth;
      cursorYear = segmentEnd;
    }
  }

  if (cursorYear < maxYear) {
    const tailLength = maxYear - cursorYear;
    rawPieces.push({
      type: "gap",
      startYear: cursorYear,
      endYear: maxYear,
      rate: gapRateRaw,
      startX: cursorX,
      endX: cursorX + tailLength * gapRateRaw
    });
  }

  if (rawPieces.length === 0) {
    rawPieces.push({
      type: "active",
      startYear: minYear,
      endYear: maxYear,
      rate: activeRateRaw,
      startX: 0,
      endX: Math.max(1, yearRange * activeRateRaw)
    });
  }

  const rawInnerWidth = Math.max(1, rawPieces[rawPieces.length - 1].endX);
  const minTargetInner = Math.max(viewportWidth - AXIS_PADDING_X * 2, 620);
  const maxTargetInner =
    viewportWidth *
      Math.max(1.25, 1.2 + zoomFactor * 1.35 + Math.min(1.5, densityPerCentury * 0.14)) -
    AXIS_PADDING_X * 2;

  let scaleFactor = 1;
  if (rawInnerWidth < minTargetInner) {
    scaleFactor = minTargetInner / rawInnerWidth;
  } else if (rawInnerWidth > maxTargetInner) {
    scaleFactor = maxTargetInner / rawInnerWidth;
  }
  scaleFactor = Math.max(0.55, Math.min(2.6, scaleFactor));

  const pieces = rawPieces.map((piece) => ({
    ...piece,
    rate: piece.rate * scaleFactor,
    startX: piece.startX * scaleFactor,
    endX: piece.endX * scaleFactor
  }));

  const innerWidth = Math.max(1, rawInnerWidth * scaleFactor);
  const timelineWidth = Math.max(viewportWidth, Math.ceil(innerWidth + AXIS_PADDING_X * 2));

  const findPieceByYear = (year) => {
    for (let index = 0; index < pieces.length; index += 1) {
      const piece = pieces[index];
      if (year >= piece.startYear && year <= piece.endYear) return piece;
    }
    return pieces[pieces.length - 1];
  };

  const findPieceByX = (x) => {
    for (let index = 0; index < pieces.length; index += 1) {
      const piece = pieces[index];
      if (x >= piece.startX && x <= piece.endX) return piece;
    }
    return pieces[pieces.length - 1];
  };

  const yearToX = (year) => {
    const safeYear = Math.max(minYear, Math.min(maxYear, year));
    const piece = findPieceByYear(safeYear);
    return AXIS_PADDING_X + piece.startX + (safeYear - piece.startYear) * piece.rate;
  };

  const xToYear = (absoluteX) => {
    const localX = Math.max(0, Math.min(innerWidth, absoluteX - AXIS_PADDING_X));
    const piece = findPieceByX(localX);
    if (piece.rate <= 0) return piece.startYear;
    return piece.startYear + (localX - piece.startX) / piece.rate;
  };

  return {
    minYear,
    maxYear,
    yearRange,
    timelineWidth,
    activeRate: activeRateRaw * scaleFactor,
    densityPerCentury,
    yearToX,
    xToYear
  };
}

function layoutPeople(people) {
  if (people.length === 0) {
    return {
      items: [],
      rowsCount: 0,
      rowHeight: BASE_ROW_HEIGHT,
      timelineWidth: 640,
      metrics: null
    };
  }

  const metrics = buildTimelineMetrics(people);
  const density = metrics.densityPerCentury;
  const rowHeight = Math.max(46, Math.min(62, BASE_ROW_HEIGHT - density * 0.5));
  const rowGapPx = Math.max(7, ROW_GAP_PX - density * 0.35);
  const labelBaseWidth = Math.max(90, Math.min(138, 126 - density * 4.3 - (state.zoom - 140) * 0.12));

  const rowsEnd = [];
  const items = [...people]
    .sort((a, b) => a.birthYear - b.birthYear)
    .map((person) => {
      const left = metrics.yearToX(person.birthYear);
      const right = metrics.yearToX(person.deathYear);
      const rawWidth = Math.max(10, right - left);
      const nameWidthBoost = Math.min(40, person.name.length * 2.1);
      const minWidth = Math.max(MIN_BAR_PX, Math.min(172, labelBaseWidth + nameWidthBoost));
      const width = Math.max(minWidth, rawWidth);

      let row = 0;
      while (row < rowsEnd.length && left <= rowsEnd[row] + rowGapPx) {
        row += 1;
      }

      rowsEnd[row] = left + width;

      return {
        ...person,
        row,
        left,
        width,
        yearsShort: formatPersonYears(person)
      };
    });

  const farRight = Math.max(...items.map((person) => person.left + person.width));
  const timelineWidth = Math.max(metrics.timelineWidth, Math.ceil(farRight + AXIS_PADDING_X * 0.6));

  return {
    items,
    rowsCount: rowsEnd.length,
    rowHeight,
    timelineWidth,
    metrics: { ...metrics, timelineWidth }
  };
}

function renderAxis(metrics, timelineWidth) {
  AXIS.innerHTML = "";
  const steps = [5, 10, 25, 50, 100, 200, 500];
  const majorStep = chooseTickStep(metrics.activeRate);
  const majorIndex = steps.indexOf(majorStep);
  const minorStep = majorIndex > 0 ? steps[majorIndex - 1] : null;

  let lastMajorX = Number.NEGATIVE_INFINITY;
  if (minorStep && minorStep * metrics.activeRate >= 36) {
    let lastMinorX = Number.NEGATIVE_INFINITY;
    const minorStart = Math.floor(metrics.minYear / minorStep) * minorStep;
    for (let year = minorStart; year <= metrics.maxYear; year += minorStep) {
      if (year % majorStep === 0) continue;
      const left = metrics.yearToX(year);
      if (left - lastMinorX < 28) continue;
      const tick = document.createElement("span");
      tick.className = "axis-tick minor";
      tick.style.left = `${Math.max(0, Math.min(timelineWidth, left))}px`;
      AXIS.append(tick);
      lastMinorX = left;
    }
  }

  const majorStart = Math.floor(metrics.minYear / majorStep) * majorStep;
  for (let year = majorStart; year <= metrics.maxYear; year += majorStep) {
    const left = metrics.yearToX(year);
    if (left - lastMajorX < 70) continue;
    const tick = document.createElement("span");
    tick.className = "axis-tick major";
    tick.style.left = `${Math.max(0, Math.min(timelineWidth, left))}px`;

    const label = document.createElement("span");
    label.textContent = formatYear(year);
    tick.append(label);
    AXIS.append(tick);
    lastMajorX = left;
  }
}

function updateTimelineReadout() {
  if (!TIMELINE_READOUT) return;
  const metrics = state.layoutMetrics;
  if (!metrics) {
    TIMELINE_READOUT.textContent = "";
    return;
  }

  const visibleStartYear = metrics.xToYear(VIEWPORT.scrollLeft);
  const visibleEndYear = metrics.xToYear(VIEWPORT.scrollLeft + VIEWPORT.clientWidth);
  const from = Math.round(Math.max(metrics.minYear, visibleStartYear));
  const to = Math.round(Math.min(metrics.maxYear, visibleEndYear));
  TIMELINE_READOUT.textContent = `Видимый период: ${formatYear(from)} - ${formatYear(to)}`;
}

function getCurrentLayoutMetrics(people) {
  if (!people.length) return null;
  return buildTimelineMetrics(people);
}

function jumpToYear(year) {
  const metrics = state.layoutMetrics ?? getCurrentLayoutMetrics(state.filteredPeople);
  if (!metrics) return;
  const clampedYear = Math.max(metrics.minYear, Math.min(metrics.maxYear, year));
  const pointX = metrics.yearToX(clampedYear);
  const targetScrollLeft = Math.max(0, pointX - VIEWPORT.clientWidth * 0.5);
  VIEWPORT.scrollTo({
    left: targetScrollLeft,
    behavior: shouldReduceMotion() ? "auto" : "smooth"
  });
}

function focusPersonInViewport(person) {
  if (!person) return;
  const centerX = person.left + person.width / 2;
  const targetScrollLeft = Math.max(0, centerX - VIEWPORT.clientWidth * 0.5);
  VIEWPORT.scrollTo({
    left: targetScrollLeft,
    behavior: shouldReduceMotion() ? "auto" : "smooth"
  });
}

function setActiveItem() {
  const pills = LANES.querySelectorAll(".life-pill");
  pills.forEach((pill) => {
    const isActive = pill.dataset.id === state.selectedId;
    pill.classList.toggle("active", isActive);
    pill.setAttribute("aria-pressed", String(isActive));
  });
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function extractThumbnail(queryData) {
  if (!queryData?.query?.pages) return null;
  const pages = Object.values(queryData.query.pages);
  for (const page of pages) {
    if (page?.thumbnail?.source) return page.thumbnail.source;
  }
  return null;
}

async function fetchPortraitUrl(person) {
  if (portraitCache.has(person.id)) {
    return portraitCache.get(person.id);
  }

  const candidateTitles = [...new Set([person.wikiTitle, person.name].filter(Boolean))];

  for (const title of candidateTitles) {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      prop: "pageimages",
      pithumbsize: String(PORTRAIT_SIZE),
      titles: title,
      redirects: "1"
    });

    try {
      const response = await fetch(`${WIKI_API_URL}?${params.toString()}`);
      if (!response.ok) continue;
      const data = await response.json();
      const thumbnail = extractThumbnail(data);
      if (thumbnail) {
        portraitCache.set(person.id, thumbnail);
        return thumbnail;
      }
    } catch {
      // Ignore network/API issues and fallback to initials.
    }
  }

  portraitCache.set(person.id, null);
  return null;
}

async function applyPortrait(person, imageEl, fallbackEl, requestId) {
  const portraitUrl = await fetchPortraitUrl(person);
  if (!imageEl.isConnected) return;
  if (state.detailsRequestId !== requestId || state.selectedId !== person.id) return;

  if (portraitUrl) {
    imageEl.src = portraitUrl;
    imageEl.hidden = false;
    fallbackEl.hidden = true;
    return;
  }

  imageEl.hidden = true;
  fallbackEl.hidden = false;
}

function renderDetails(person) {
  state.detailsRequestId += 1;
  const requestId = state.detailsRequestId;

  if (!person) {
    DETAILS.className = "details-card empty";
    DETAILS.innerHTML = "<p>Ничего не найдено по заданному фильтру.</p>";
    DETAILS.classList.add("is-visible");
    return;
  }

  DETAILS.className = "details-card";
  DETAILS.innerHTML = "";

  const head = document.createElement("div");
  head.className = "details-head";

  const avatar = document.createElement("div");
  avatar.className = "details-avatar";
  avatar.setAttribute("aria-hidden", "true");

  const image = document.createElement("img");
  image.className = "details-avatar-img";
  image.alt = `Портрет: ${person.name}`;
  image.width = 84;
  image.height = 84;
  image.loading = "lazy";
  image.decoding = "async";
  image.hidden = true;

  const fallback = document.createElement("span");
  fallback.className = "details-avatar-fallback";
  fallback.textContent = getInitials(person.name);

  image.addEventListener("error", () => {
    image.hidden = true;
    fallback.hidden = false;
  });

  avatar.append(image, fallback);

  const heading = document.createElement("div");
  heading.className = "details-heading";

  const name = document.createElement("h3");
  name.textContent = person.name;

  const meta = document.createElement("p");
  meta.className = "details-meta";
  const categoryLabel = CATEGORIES[person.category]?.label ?? person.category;
  meta.textContent = `${categoryLabel} · ${person.birthDate} - ${person.deathDate}`;
  heading.append(name, meta);
  head.append(avatar, heading);

  const summary = document.createElement("p");
  summary.className = "details-summary";
  summary.textContent = person.summary;

  const list = document.createElement("ul");
  list.className = "details-achievements";
  person.achievements.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    list.append(item);
  });

  DETAILS.append(head, summary, list);
  applyPortrait(person, image, fallback, requestId);

  if (shouldReduceMotion()) {
    DETAILS.classList.add("is-visible");
  } else {
    requestAnimationFrame(() => {
      DETAILS.classList.add("is-visible");
    });
  }
}

function renderTimeline(people) {
  LANES.innerHTML = "";

  if (people.length === 0) {
    AXIS.innerHTML = "";
    LANES.style.height = "auto";
    AXIS.style.width = "100%";
    LANES.style.width = "100%";
    state.layoutMetrics = null;
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "По этим фильтрам персон не найдено.";
    LANES.append(empty);
    renderDetails(null);
    return;
  }

  const { items, rowsCount, rowHeight, timelineWidth, metrics } = layoutPeople(people);
  state.layoutMetrics = metrics;
  LANES.style.height = `${Math.max(220, rowsCount * rowHeight)}px`;
  AXIS.style.width = `${timelineWidth}px`;
  LANES.style.width = `${timelineWidth}px`;
  renderAxis(metrics, timelineWidth);

  items.forEach((person, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "life-pill";
    button.dataset.id = person.id;
    button.setAttribute("role", "listitem");
    button.style.left = `${person.left}px`;
    button.style.width = `${person.width}px`;
    button.style.top = `${person.row * rowHeight}px`;
    button.style.setProperty("--pill-color", CATEGORIES[person.category].color);
    button.style.setProperty("--entry-delay", `${Math.min(index, 28) * 18}ms`);
    button.setAttribute("aria-label", `${person.name}, ${person.birthDate} - ${person.deathDate}`);

    const name = document.createElement("span");
    name.className = "person-name";
    name.textContent = person.name;

    const years = document.createElement("span");
    years.className = "person-years";
    years.textContent = person.yearsShort;

    button.append(name, years);
    button.addEventListener("click", () => {
      state.selectedId = person.id;
      setActiveItem();
      renderDetails(person);
      focusPersonInViewport(person);
    });
    LANES.append(button);

    if (shouldReduceMotion()) {
      button.classList.add("is-visible");
    } else {
      requestAnimationFrame(() => {
        button.classList.add("is-visible");
      });
    }
  });

  const selectedExists = items.some((person) => person.id === state.selectedId);
  if (!selectedExists) {
    state.selectedId = items[0].id;
  }

  setActiveItem();
  const selectedPerson = items.find((person) => person.id === state.selectedId);
  renderDetails(selectedPerson);

  if (selectedPerson) {
    if (shouldReduceMotion()) {
      focusPersonInViewport(selectedPerson);
    } else {
      requestAnimationFrame(() => {
        focusPersonInViewport(selectedPerson);
      });
    }
  }
}

function render() {
  const filtered = getFilteredPeople();
  state.filteredPeople = filtered;
  RESULTS_COUNT.textContent = String(filtered.length);
  renderTimeline(filtered);
  updateCategoryButtonsState();
  syncActiveEraWithScroll();
  updateTimelineReadout();
}

function updateDataSourceNote() {
  if (!DATA_SOURCE_NOTE) return;
  const sourceMap = {
    supabase: "Источник данных: Supabase",
    local: "Источник данных: localStorage",
    seed: "Источник данных: встроенный набор"
  };
  DATA_SOURCE_NOTE.textContent = sourceMap[state.dataSource] || "";
}

async function loadPeopleFromService() {
  if (!dataService) {
    state.people = [...PEOPLE];
    state.dataSource = "seed";
    updateDataSourceNote();
    return;
  }

  try {
    const result = await dataService.fetchPeople(PEOPLE);
    const loaded = Array.isArray(result.people) ? result.people : [];
    if (loaded.length) {
      state.people = loaded;
      state.dataSource = result.source || "seed";
    } else {
      state.people = [...PEOPLE];
      state.dataSource = "seed";
    }
  } catch {
    state.people = [...PEOPLE];
    state.dataSource = "seed";
  }

  updateDataSourceNote();
}

function syncActiveEraWithScroll() {
  const metrics = state.layoutMetrics ?? getCurrentLayoutMetrics(state.filteredPeople);
  if (!metrics) return;
  const centerPx = VIEWPORT.scrollLeft + VIEWPORT.clientWidth / 2;
  const centerYear = metrics.xToYear(centerPx);
  let nearest = ERAS[0];
  let smallestDistance = Number.POSITIVE_INFINITY;

  for (const era of ERAS) {
    const distance = Math.abs(era.year - centerYear);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      nearest = era;
    }
  }

  setActiveEraPill(nearest.id);
  updateTimelineReadout();
}

function bindEvents() {
  SEARCH_INPUT.addEventListener("input", (event) => {
    state.query = event.currentTarget.value;
    render();
  });

  ZOOM_RANGE.addEventListener("input", (event) => {
    state.zoom = Number(event.currentTarget.value);
    render();
  });

  VIEWPORT.addEventListener(
    "wheel",
    (event) => {
      if (!event.shiftKey) return;
      event.preventDefault();
      VIEWPORT.scrollLeft += event.deltaY;
    },
    { passive: false }
  );

  VIEWPORT.addEventListener(
    "scroll",
    () => {
      syncActiveEraWithScroll();
    },
    { passive: true }
  );

  window.addEventListener(
    "resize",
    () => {
      render();
    },
    { passive: true }
  );
}

function initParallax() {
  if (!PARALLAX_LAYERS.length || shouldReduceMotion()) return;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let targetScroll = window.scrollY;
  let currentScroll = window.scrollY;
  let frameId = 0;

  const update = () => {
    frameId = 0;
    currentX += (targetX - currentX) * 0.09;
    currentY += (targetY - currentY) * 0.09;
    currentScroll += (targetScroll - currentScroll) * 0.08;

    const maxScrollable = Math.max(1, document.body.scrollHeight - window.innerHeight);
    const scrollProgress = currentScroll / maxScrollable;

    PARALLAX_LAYERS.forEach((layer) => {
      const depth = Number(layer.dataset.parallaxDepth ?? 0);
      const translateX = currentX * depth;
      const translateY = currentY * depth + scrollProgress * 24 * depth;
      layer.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    });

    const moving =
      Math.abs(targetX - currentX) > 0.02 ||
      Math.abs(targetY - currentY) > 0.02 ||
      Math.abs(targetScroll - currentScroll) > 0.12;

    if (moving) frameId = requestAnimationFrame(update);
  };

  const requestFrame = () => {
    if (!frameId) frameId = requestAnimationFrame(update);
  };

  if (HAS_HOVER_MEDIA.matches) {
    window.addEventListener(
      "pointermove",
      (event) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        targetX = ((event.clientX - centerX) / centerX) * 7.5;
        targetY = ((event.clientY - centerY) / centerY) * 7.5;
        requestFrame();
      },
      { passive: true }
    );

    window.addEventListener(
      "pointerleave",
      () => {
        targetX = 0;
        targetY = 0;
        requestFrame();
      },
      { passive: true }
    );
  }

  window.addEventListener(
    "scroll",
    () => {
      targetScroll = window.scrollY;
      requestFrame();
    },
    { passive: true }
  );

  requestFrame();
}

async function init() {
  renderEraPills();
  setActiveEraPill("modern");
  renderLegend();
  bindEvents();
  initParallax();
  await loadPeopleFromService();
  render();
}

init();
