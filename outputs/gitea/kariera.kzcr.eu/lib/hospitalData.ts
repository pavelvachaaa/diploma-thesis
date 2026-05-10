import { getAssetPath } from "@/lib/paths"

export type Hospital = {
  slug: string
  code: string
  color: string
  name: string
  address: string
  hrPhone: string
  hrEmail: string
  facebookUrl: string | null
  region: string
  website: string
  image: string
}

export const hospitals: Hospital[] = [
  {
    slug: "decin",
    code: "DC",
    color: "#39b59f",
    name: "Nemocnice Děčín",
    address: "U Nemocnice 1, 405 99 Děčín II",
    hrPhone: "+420 775 227 745",
    hrEmail: "hr.decin@kzcr.eu",
    facebookUrl: "https://www.facebook.com/profile.php?id=61588569754057",
    region: "Děčínsko",
    website: "https://www.kzcr.eu/cz/dc/",
    image: getAssetPath("/hospital-decin.jpeg"),
  },
  {
    slug: "usti",
    code: "UL",
    color: "#f28d76",
    name: "Masarykova nemocnice",
    address: "Sociální péče 3316/12A, 401 13 Ústí nad Labem",
    hrPhone: "+420 705 777 934",
    hrEmail: "hr.usti@kzcr.eu",
    facebookUrl: "https://www.facebook.com/profile.php?id=61587640357819",
    region: "Ústecko",
    website: "https://www.kzcr.eu/cz/ul/",
    image: getAssetPath("/hospital-usti.webp"),
  },
  {
    slug: "teplice",
    code: "TP",
    color: "#14284d",
    name: "Nemocnice Teplice",
    address: "Duchcovská 53, 415 29 Teplice",
    hrPhone: "+420 734 120 477",
    hrEmail: "hr.teplice@kzcr.eu",
    facebookUrl: "https://www.facebook.com/profile.php?id=61587933660263",
    region: "Teplicko",
    website: "https://www.kzcr.eu/cz/tp/",
    image: getAssetPath("/Teplice.jpg"),
  },
  {
    slug: "most",
    code: "MO",
    color: "#dca2c8",
    name: "Nemocnice Most",
    address: "J. E. Purkyně 270/5, 434 64 Most",
    hrPhone: "+420 608 000 466",
    hrEmail: "hr.most@kzcr.eu",
    facebookUrl: null,
    region: "Mostecko",
    website: "https://www.kzcr.eu/cz/mo/",
    image: getAssetPath("/hospital-most.jpeg"),
  },
  {
    slug: "chomutov",
    code: "CV",
    color: "#973480",
    name: "Nemocnice Chomutov",
    address: "Kochova 1185, 430 12 Chomutov",
    hrPhone: "+420 723 191 530",
    hrEmail: "hr.chomutov@kzcr.eu",
    facebookUrl: "https://www.facebook.com/profile.php?id=61587869702827",
    region: "Chomutovsko",
    website: "https://www.kzcr.eu/cz/cv/",
    image: getAssetPath("/hospital-chomutov.webp"),
  },
  {
    slug: "litomerice",
    code: "LT",
    color: "#c3bb00",
    name: "Nemocnice Litoměřice",
    address: "Žitenická 2084, 412 01 Litoměřice",
    hrPhone: "+420 793 979 780",
    hrEmail: "hr.litomerice@kzcr.eu",
    facebookUrl: "https://www.facebook.com/profile.php?id=61587667808908",
    region: "Litoměřicko",
    website: "https://www.kzcr.eu/cz/lt/",
    image: getAssetPath("/Litomerice.jpg"),
  },
  {
    slug: "rumburk",
    code: "RB",
    color: "#c26f03",
    name: "Nemocnice Rumburk",
    address: "Jiráskova 1378/4, 408 01 Rumburk",
    hrPhone: "+420 705 564 726",
    hrEmail: "hr.rumburk@kzcr.eu",
    facebookUrl: "https://www.facebook.com/profile.php?id=61587501916169",
    region: "Šluknovský výběžek",
    website: "https://www.kzcr.eu/cz/rb/",
    image: getAssetPath("/Rumburk.jpeg"),
  },
]

export function getHospitalBySlug(slug: string): Hospital | undefined {
  return hospitals.find((h) => h.slug === slug)
}
