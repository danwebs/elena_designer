/* =====================================================================
   ДАННЫЕ САЙТА — здесь редактируются стили и проекты.
   Фото проектов кладите в assets/img/projects/, фото стилей — в
   assets/img/styles/. Пути указываются относительно корня сайта.
   ===================================================================== */
(function () {
  "use strict";

  /* Стили. Ключ — латиница (например, organic-modern). Он же
     используется в PROJECTS.style и в фильтре портфолио.
     Формат записи:
     "ключ": {
       name: "Название в фильтре",
       image: "assets/img/styles/ключ.jpg",
       desc: "Короткое описание стиля",
       palette: [["Название", "#RRGGBB"], ... 5 цветов],
       planning: ["Планировочное решение", ... 4 пункта],
       ideas: ["Идея", ... 3–5 пунктов]
     } */
  var STYLES = {
    "organic-modern": {
      name: "Современный органический",
      image: "assets/img/styles/organic-modern.jpg",
      desc: "Спокойный современный интерьер с природными фактурами: сине-серые реечные панели, фактурный камень, светлый дуб, латунь и мягкий текстиль. Формы простые, но не стерильные.",
      palette: [["Сине-серый", "#5E7480"], ["Тёплый белый", "#EDE9E1"], ["Фактурный камень", "#D8D5CE"], ["Светлый дуб", "#B08A5F"], ["Латунь", "#B08D57"]],
      planning: [
        "Мягкая зона с диваном вдоль стены",
        "Столики у панорамных окон",
        "Центральная световая инсталляция над залом",
        "Зона кассы и витрины у входа"
      ],
      ideas: ["Реечные панели сине-серого оттенка", "Фактурная штукатурка под камень", "Светлый дуб и латунь", "Плетёные кресла и плотный текстиль", "Световое облако над залом"]
    },
    "modern-classic": {
      name: "Современная классика",
      image: "assets/img/styles/modern-classic.jpg",
      desc: "Современная классика без музейности: оливково-зелёные стены, французская ёлка, горчичный велюр и латунные детали. Сдержанная геометрия и тёплый свет.",
      palette: [["Оливковый", "#5F6B58"], ["Горчичный", "#C89B3C"], ["Тёплый дуб", "#B98D5F"], ["Кремовый", "#E8E1D4"], ["Графит", "#3B3B39"]],
      planning: [
        "Кухня-гостиная с островом и обеденной группой",
        "Встроенные двери в цвет стен",
        "Спальня с мягким изголовьем",
        "Отдельный санузел с душевой"
      ],
      ideas: ["Оливково-зелёные стены", "Французская ёлка", "Горчичный велюр", "Латунные светильники", "Скрытая подсветка по потолку"]
    }
  };

  /* Проекты портфолио. Порядок в массиве = порядок карточек.
     Формат записи:
     {
       id: "p1",
       title: "Название проекта",
       kind: "Реализация" | "Визуализация",
       style: "ключ из STYLES",
       city: "Город",
       area: "Площадь",
       term: "Срок",
       images: ["assets/img/projects/файл.jpg", ...],
       task: "Задача",
       solution: "Решение"
     }
     Первое фото в images становится обложкой.
     area, term и city можно оставить "—", если данных пока нет. */
  var PROJECTS = [
    {
      id: "cafe-cloud-light",
      title: "Кофейня с облачным светом",
      kind: "Реализация",
      style: "organic-modern",
      city: "—",
      area: "—",
      term: "—",
      images: [
        "assets/img/projects/cafe-01.jpg",
        "assets/img/projects/cafe-02.jpg",
        "assets/img/projects/cafe-03.jpg",
        "assets/img/projects/cafe-04.jpg",
        "assets/img/projects/cafe-05.jpg",
        "assets/img/projects/cafe-06.jpg",
        "assets/img/projects/cafe-07.jpg",
        "assets/img/projects/cafe-08.jpg",
        "assets/img/projects/cafe-09.jpg"
      ],
      task: "Создать интерьер кофейни, в котором сочетаются спокойная палитра, природные фактуры и выразительный световой акцент над залом.",
      solution: "Сине-серые реечные панели, фактурная белая стена, светлый дуб и латунь. Над залом — объёмная световая инсталляция, у окон — лёгкие столы, в глубине — мягкий синий диван."
    },
    {
      id: "green-flat",
      title: "Квартира в оливковых тонах",
      kind: "Реализация",
      style: "modern-classic",
      city: "—",
      area: "—",
      term: "—",
      images: [
        "assets/img/projects/green-flat-02.jpg",
        "assets/img/projects/green-flat-01.jpg",
        "assets/img/projects/green-flat-03.jpg",
        "assets/img/projects/green-flat-04.jpg",
        "assets/img/projects/green-flat-05.jpg",
        "assets/img/projects/green-flat-06.jpg",
        "assets/img/projects/green-flat-07.jpg",
        "assets/img/projects/green-flat-08.jpg",
        "assets/img/projects/green-flat-09.jpg",
        "assets/img/projects/green-flat-10.jpg",
        "assets/img/projects/green-flat-11.jpg",
        "assets/img/projects/green-flat-12.jpg",
        "assets/img/projects/green-flat-13.jpg",
        "assets/img/projects/green-flat-14.jpg",
        "assets/img/projects/green-flat-15.jpg"
      ],
      task: "Собрать спокойный современный интерьер квартиры с кухней-гостиной, закрытым хранением и мягкой зоной отдыха.",
      solution: "Оливково-зелёные стены и французская ёлка, горчичный диван, латунные светильники и встроенные двери в цвет стен. Свет — по сценариям, хранение — вдоль стен."
    }
  ];

  window.SITE_DATA = Object.freeze({ STYLES: STYLES, PROJECTS: PROJECTS });
})();
