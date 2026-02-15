#import "utils.typ": assert_dict_has, assert_type_signature, deref, is_none, map_none, ok_or
#import "type_signature.typ": *


#let arguments_structure = {
  let lang_keys = variants(literal("cs"), literal("en"))
  let nonrec_str = doc(string, none, (
    cs: "Je doporučeno použít 'content', pokud je to možné",
    en: "It is recommended to use 'content' where that's possible",
  ))
  let cont_or_str = variants(cont, nonrec_str)
  let opt_cont_or_str = variants(cont, nonrec_str, null)

  // == DOCUMENT ==
  let document = {
    let visual_style = doc(keyval(literal("visual_style"), variants(literal("classic"))), "style", (
      cs: "Vizuální styl šablony",
      en: "Visual style of the template",
    ))

    let faculty = doc(
      keyval(literal("faculty"), variants(
        doc(literal("fs"), none, (cs: "Fakulta strojní", en: "Faculty of mechanical engineering")),
        doc(literal("ft"), none, (cs: "Fakulta textilní", en: "Faculty of textile engineering")),
        doc(literal("fp"), none, (
          cs: "Fakulta přírodovědně-humanitní a pedagogická",
          en: "Faculty of science, humanities and education",
        )),
        doc(literal("ef"), none, (cs: "Ekonomická fakulta", en: "Faculty of economics")),
        doc(literal("fua"), none, (
          cs: "Fakulta umění a architektury",
          en: "Faculty of arts and architecture",
        )),
        doc(literal("fm"), none, (
          cs: "Fakulta mechatroniky, informatiky a mezioborových studií",
          en: "Faculty of mechatronics, informatics and interdisciplinary studies",
        )),
        doc(literal("fzs"), none, (
          cs: "Fakulta zdravotnických studií",
          en: "Faculty of health studies",
        )),
        doc(literal("cxi"), none, (
          cs: "Ústav pro nanomateriály, pokročilé technologie a inovace",
          en: "Institute for nanomaterials, advanced technology and innovation",
        )),
        doc(literal("tul"), none, (cs: "Obecný styl TUL", en: "Generic TUL theme")),
      )),
      "faculty",
      (
        cs: "Fakulta (na základě toho budou vybrány barvy, logotypy, ...)",
        en: "Faculty (based on this, the theme of the document will be chosen)",
      ),
    )

    let language = doc(
      keyval(literal("language"), variants(
        doc(literal("cs"), none, (cs: "Čeština", en: "Czech")),
        doc(literal("en"), none, (cs: "Angličtina", en: "English")),
      )),
      "lang",
      (cs: "Primární jazyk dokumentu", en: "Primary language of the document"),
    )

    let type = doc(
      keyval(literal("type"), variants(
        doc(literal("bp"), none, (cs: "Bakalářská práce", en: "Bachelor's thesis")),
        doc(literal("dp"), none, (cs: "Diplomová práce", en: "Diploma thesis")),
        doc(literal("prj"), none, (
          cs: "Projekt (ročník před odevzdáním bakalářské práce)",
          en: "Project (the year before bachelor's thesis)",
        )),
        doc(literal("sp"), none, (cs: "Semestrální práce", en: "Term paper")),
        doc(literal("presentation"), none, (cs: "Prezentace", en: "Presentation")),
        doc(literal("other"), none, (cs: "Obecný dokument", en: "Generic dokument")),
      )),
      "document",
      (cs: "Typ dokumentu", en: "The type of the document"),
    )

    let content_only = doc(
      keyval(literal("content_only"), bool),
      "content_only",
      (
        cs: "Zda u dokumentu typu `other` generovat pouze obsah",
        en: "Whether to generate only content for document of type `other`",
      ),
    )

    let bonding_style = doc(
      keyval(literal("bonding_style"), variants(
        doc(literal("switch"), none, (
          cs: "Střídat odsazení pro oboustranný tisk",
          en: "Switch bonding for double-sided printing",
        )),
        doc(literal("left"), none, (
          cs: "Vazba na levé straně",
          en: "Bonding on the left side",
        )),
        doc(literal("none"), none, (
          cs: "Bez vazby (například pro elektronické dokumenty)",
          en: "No bonding (e.g. for electronic documents)",
        )),
        doc(null, none, (
          cs: "Použít výchozí nastavení pro daný dokument",
          en: "Use default bonding for the selected document",
        ))
      )),
      "bonding_style",
      (cs: "Typ odsazení stránek", en: "Page margin style")
    )

    keyval(literal("document"), struct(
      visual_style, faculty, language, type, content_only, bonding_style
    ))
  }

  // == TITLE PAGES ==
  let title_pages = doc(
    keyval(
      literal("title_pages"),
      variants(
        doc(string, none, (
          cs: "Cesta k souboru PDF, který má být vložen",
          en: "The path to the PDF document to insert",
        )),
        doc(
          null,
          none,
          (
            cs: "Stránky jsou generovány pomocí šablony. Tohle u některých prací může vyžadovat doplnění informací (argumentů).",
            en: "The pages are generated through the template. This can require more arguments for certain documents.",
          ),
        ),
      ),
    ),
    "title_pages",
    (
      cs: "Způsob generování stránek na začátku dokumentu",
      en: "Method of inserting/generating the first few pages of the document",
    ),
  )

  // == TITLE ==
  let title = doc(
    keyval(literal("title"), dict(keyval(
      variants(
        // title
        doc(literal("cs"), none, (cs: "Název práce v češtině", en: "Document title in Czech")),
        doc(literal("en"), none, (cs: "Název práce v angličtině", en: "Document title in English")),
      ),
      cont_or_str,
    ))),
    "title",
    (cs: "Název práce", en: "Document title"),
  )

  // == AUTHOR ==
  let author = {
    let name = doc(keyval(literal("name"), variants(
      doc(null, none, (
        cs: "Žádný autor - toto může způsobit chybu u některých dokumentů",
        en: "No author - this can cause a panic for some documents",
      )),
      doc(cont_or_str, none, (
        cs: "Jeden autor",
        en: "Single author",
      )),
      doc(slice(cont_or_str), none, (
        cs: "Více autorů",
        en: "Multiple authors",
      )),
    )), "author", (
      cs: "Jméno autora/ů včetně titulů",
      en: "The name of the author(s) including titles",
    ))

    let pronouns = doc(
      keyval(literal("pronouns"), variants(
        doc(literal("masculine"), none, (
          cs: "Pro češtinu, oslovení v mužském rodě",
          en: "For Czech (masculine)",
        )),
        doc(literal("feminine"), none, (
          cs: "Pro češtinu, oslovení v ženském rodě",
          en: "For Czech (feminine)",
        )),
        doc(literal("we"), none, (
          cs: "Pro češtinu a angličtinu, oslovení v množném čísle",
          en: "For Czech and English, plural",
        )),
        doc(literal("me"), none, (
          cs: "Pro angličtinu, oslovení v jednotném čísle",
          en: "For English, singular",
        )),
        doc(null, none, (
          cs: "Pro angličtinu, oslovení v jednotném čísle",
          en: "Fallback for English, singular",
        )),
      )),
      "author_pronouns",
      (cs: "Oslovení autora / autorů", en: "Author pronouns"),
    )

    let programme = doc(
      keyval(literal("programme"), variants(dict(keyval(lang_keys, cont_or_str)), null)),
      "programme",
      (
        cs: "Studijní program, pod kterým byl tento dokument vytvořen",
        en: "Study programme of the author",
      ),
    )

    let specialization = doc(
      keyval(literal("specialization"), variants(dict(keyval(lang_keys, cont_or_str)), null)),
      "specialization",
      (
        cs: "Specializace, pod kterou byl tento dokument vytvořen",
        en: "Specialization of the author",
      ),
    )

    let year_of_study = doc(keyval(literal("year_of_study"), opt_cont_or_str), "year_of_study", (
      cs: "Ročník studia autora",
      en: "The year of study of the author",
    ))

    keyval(literal("author"), struct(name, pronouns, programme, specialization, year_of_study))
  }

  // == PROJECT ==
  let project = {
    let supervisor = doc(
      keyval(literal("supervisor"), variants(
        cont,
        nonrec_str,
        struct(
          doc(keyval(literal("name"), cont_or_str), none, (
            cs: "Jméno vedoucího projektu",
            en: "The name of the project's supervisor",
          )),
          doc(keyval(literal("institute"), cont_or_str), none, (
            cs: "Ústav vedoucího projektu",
            en: "The institute of the project's supervisor",
          )),
        ),
        null,
      )),
      "supervisor",
      (cs: "Vedoucí projektu", en: "Project supervisor"),
    )

    let consultant = doc(
      keyval(literal("consultant"), variants(
        cont,
        nonrec_str,
        struct(
          doc(keyval(literal("name"), cont_or_str), none, (
            cs: "Jméno konzultanta projektu",
            en: "Name of the project's consultant",
          )),
          doc(keyval(literal("institute"), cont_or_str), none, (
            cs: "Ústav konzultanta projektu",
            en: "The institute of the project's consultant",
          )),
        ),
        null,
      )),
      "consultant",
      (cs: "Konzultant projektu", en: "Project's consultant"),
    )

    keyval(literal("project"), struct(supervisor, consultant))
  }

  // == ABSTRACT ==
  let abstract = {
    let content = doc(
      keyval(literal("content"), variants(
        struct(..lang_keys.variants.map(k => {
          keyval(k, variants(cont, nonrec_str, slice(string)))
        })),
        null,
      )),
      "abstract",
      (cs: "Abstrakt projektu", en: "Project's abstract"),
    )

    let keywords = doc(
      keyval(literal("keywords"), variants(
        struct(..lang_keys.variants.map(k => {
          keyval(k, variants(cont, nonrec_str, slice(string)))
        })),
        null,
      )),
      "keywords",
      (cs: "Klíčová slova projektu", en: "Project's keywords"),
    )

    keyval(literal("abstract"), struct(content, keywords))
  }

  // == ACKNOWLEDGEMENT ==
  let acknowledgement = doc(
    keyval(literal("acknowledgement"), variants(dict(keyval(lang_keys, cont_or_str)), null)),
    "acknowledgement",
    (cs: "Poděkování", en: "Acknowledgement"),
  )

  // == ASSIGNMENT ==
  let assignment = doc(
    // assignment
    keyval(
      literal("assignment"),
      variants(
        doc(string, none, (
          cs: "Zadání bude vloženo z PDF souboru s touto cestou",
          en: "The assignment will be inserted from a PDF file with this path",
        )),
        doc(
          struct(
            keyval(literal("personal_number"), cont_or_str),
            keyval(literal("department"), cont_or_str),
            keyval(literal("academical_year"), cont_or_str),
            doc(keyval(literal("content"), cont), none, (
              cs: "Obsah zadání (zobrazen pod informacemi)",
              en: "Content of the assignment (shown bellow informations)",
            )),
          ),
          none,
          (
            cs: "Zadání bude vygenerováno šablonou",
            en: "The assignment will be creating through this template",
          ),
        ),
        doc(
          null,
          none,
          (
            cs: "Pokud je zadání vyžadováno typem dokumentu, bude vložena strana s upozorněním na vložení",
            en: "If the assignment is required by the document type, a page with a warning will be inserted",
          ),
        ),
        doc(cont, none, (
          cs: "Zdrojový kód se zadáním (tato možnost se nedoporučuje)",
          en: "Source code for the page (is not recommended)",
        )),
      ),
    ),
    "assignment",
    (cs: "Stránka / stránky se zadáním", en: "Page / pages with the assignment"),
  )

  // == PRESENTATION ==
  let presentation_info = {
    let append_thanks = doc(keyval(literal("append_thanks"), bool), none, (
      cs: "Zda na konec prezentace vložit poděkování za pozornost",
      en: "Whether to thank for attention at the end of the presentation",
    ))

    let wide = doc(keyval(literal("wide"), bool), none, (
      cs: "Jestli použít široký režim (16:9 - `true`) nebo úzký (4:3 - `false`)",
      en: "Whether to use widescreen format (16:9 - `true`) or narrow format (4:3 - `false`)",
    ))

    let first_heading_is_fullpage = doc(
      keyval(literal("first_heading_is_fullpage"), bool),
      none,
      (
        cs: "Pokud je nastaveno `true`, pak se nadpisy první úrovně budou vkládat na samostatnou stránku",
        en: "When set to `true`, headings of first level will be on a separate page",
      ),
    )

    doc(
      keyval(literal("presentation_info"), variants(null, struct(
        append_thanks,
        wide,
        first_heading_is_fullpage,
      ))),
      "presentation",
      (
        cs: "Argumenty pro dokument typu `presentation`",
        en: "Arguments for a document of type `presentation`",
      ),
    )
  }

  // == CITATIONS ==
  let citations = {
    let bibliography = doc(
      // citations
      keyval(literal("bibliography"), variants(
        doc(string, none, (
          cs: "Cesta k souboru s bibliografií",
          en: "The path to the bibliography file",
        )),
        doc(slice(string), none, (
          cs: "Cesty k souborům s bibliografií",
          en: "Paths to the bibliography files",
        )),
      )),
      "citations",
      (cs: "Zdroj(e) bibliografie", en: "Bibliography source(s)"),
    )

    let style = doc(
      // citation_style
      keyval(literal("style"), variants(
        doc(null, none, (cs: "Použít výchozí styl", en: "Use the default style")),
        doc(literal("numeric"), none, (
          cs: "Čísla v hranatých závorkách",
          en: "Numbers in square brackets",
        )),
      )),
      "citation_style",
      (
        cs: "Styl citací",
        en: "Citatino style"
      )
    )

    keyval(literal("citations"), struct(
      bibliography, style,
    ))
  }

  struct(
    document,
    title_pages,
    title,
    author,
    project,
    abstract,
    acknowledgement,
    assignment,
    presentation_info,
    citations,
  )
}

#let print_argument_docs(lang: "en") = {
  signature_docs(arguments_structure, lang: lang)
}

#let check_arguments(args, structure: arguments_structure, namespace: none) = {
  let res = signature_check(args, structure, "")
  if not res.at(0) {
    let panic_message = res.at(1)
    panic(panic_message)
  }
}

#let get_arg_single(args, path) = {
  let args = args
  for segment in path.split(".") {
    if segment not in args {
      panic("invalid argument query path: " + str(path))
    }
    args = args.at(segment)
  }
  args
}

#let get_arg(args, path) = {
  if type(path) == array {
    let res = ()
    for path in path {
      res.push(get_arg_single(args, path))
    }
    res
  } else if type(path) == str {
    get_arg_single(args, path)
  } else {
    panic("invalid argument path")
  }
}

#let req_arg_single(args, path) = {
  let arg = get_arg_single(args, path)
  if is_none(arg) {
    let panic_message = (
      path.split(".").join(" ").replace("_", " ") + " is missing"
    )
    panic(panic_message)
  }
  arg
}

#let req_arg(args, path) = {
  if type(path) == array {
    let res = ()
    for path in path {
      res.push(req_arg_single(args, path))
    }
    res
  } else if type(path) == str {
    req_arg_single(args, path)
  } else {
    panic("invalid argument path")
  }
}

#let map_arg_single(args, path, mapper) = {
  let arg = get_arg(args, path)
  map_none(arg, mapper)
}

#let map_arg(args, path, mapper) = {
  if type(path) == array {
    let res = ()
    for path in path {
      res.push(map_arg_single(args, path, mapper))
    }
    res
  } else if type(path) == str {
    map_arg_single(args, path, mapper)
  } else {
    panic("invalid argument path")
  }
}

#let arguments(
  document_info,
  title_pages,
  title,
  author_info,
  project_info,
  abstract_info,
  acknowledgement,
  assignment,
  presentation,
  citations,
) = {
  (
    document: document_info,
    title_pages: title_pages,
    title: title,
    author: author_info,
    project: project_info,
    abstract: abstract_info,
    acknowledgement: acknowledgement,
    assignment: assignment,
    presentation_info: presentation,
    citations: citations,
  )
}

#let document_info(
  visual_style,
  faculty_abbreviation,
  language_abbreviation,
  document_type,
  content_only,
  bonding_style,
) = {
  (
    visual_style: visual_style,
    faculty: faculty_abbreviation,
    language: language_abbreviation,
    type: document_type,
    content_only: content_only,
    bonding_style: bonding_style,
  )
}

#let author_info(name, pronouns, programme, specialization, year_of_study) = {
  (
    name: name,
    pronouns: pronouns,
    programme: programme,
    specialization: specialization,
    year_of_study: year_of_study,
  )
}

#let project_info(supervisor, consultant) = {
  (supervisor: supervisor, consultant: consultant)
}

#let abstract_info(abstract, keywords) = {
  (content: abstract, keywords: keywords)
}

#let citation_info(bibliography, style) = {
  (bibliography: bibliography, style: style)
}
