// +---------------+
// | TULTemplate 2 |
// +---------------+
//
// Typst TUL template for all kinds of documents.
//
// Git: https://git.zumepro.cz/tul/tultemplate2

#import "prototyping.typ": todo, profile
#import "attachments.typ": (
  attachments, attach_content, attach_pdf, attach_link, attach_file_reference
)

// TUL Template 2
//
// Use this at the beginning of a Typst file:
// ```typst
// #import "template/template.typ": *
//
// #show: tultemplate2.with(
//   "classic", "fm", "cs", ...
// )
// ```
//
// - style (str): Visual style to use. This can be "classic".
// - faculty (str): Factulty abbreviation. One of "fs", "ft", "fp", "ef", "fua", "fm", "fzs", "cxi".
// - lang (str): Language code. This can be "cs" or "en".
// - document (str): Type of document. This can be "bp" or "other".
// - title_pages (str): The title pages exported from STAG (supported for some document types)
// - title (dictionary): The title of the document.
// - author (str): The name of the document's author.
// - author_pronouns (str): The gender of the document's author. Needed only for the `cs` language.
// - supervisor (str): The name of the document's supervisor.
// - consultant (str): The name of the document's consultant.
// - programme (dictionary): Study programme.
// - specialization (disctionary): Study specialization
// - year_of_study (int): Year of study
// - abstract (dictionary): The abstract.
// - keywords (dictionary): The abstract keywords.
// - assignment (str): Filepath of the assignment document/page.
// - citations (str): The location of the citation file.
// - content (content): The content of the document
//
//-> none
#let tultemplate2(
  // general settings
  style: "classic", faculty: "tul", lang: "cs", document: "other",

  // document info
  title_pages: none,
  title: none, keywords: none, abstract: none, acknowledgement: none, author: none,
  author_pronouns: none, supervisor: none, consultant: none, programme: none,
  specialization: none, year_of_study: none,

  // links
  assignment: none, citations: "citations.bib",

  // content
  content,
) = {
  import "arguments.typ": (
    arguments,
    document_info,
    author_info,
    project_info,
    abstract_info,
    check_arguments,
    req_arg,
  )

  let args = arguments(
    document_info(style, faculty, lang, document),
    title_pages,
    title,
    author_info(author, author_pronouns, programme, specialization, year_of_study),
    project_info(supervisor, consultant),
    abstract_info(abstract, keywords),
    acknowledgement,
    assignment,
    citations,
  );
  check_arguments(args);

  import "utils.typ": assert_in_dict, assert_type_signature

  // templates
  import "classic/classic.typ": template_classic
  let templates = (
    classic: template_classic,
  );
  assert_in_dict(style, templates, "template name");

  // language set-up
  import "lang.typ": lang_ids
  assert_in_dict(lang, lang_ids, "language abbreviation");
  set text(lang: lang);

  // template call
  templates.at(style)(args, content);

  import "prototyping.typ": assert_release_ready
  assert_release_ready();
}

#let tultitlepages2(
  style: "classic", faculty: "tul", lang: "cs", document: "other",

  title: none, author: none,
  author_pronouns: none, supervisor: none, consultant: none, programme: none,
  specialization: none, year_of_study: none,

  assignment: none,
) = {
  import "arguments.typ": (
    arguments,
    document_info,
    author_info,
    project_info,
    abstract_info,
    check_arguments,
    req_arg,
  )
  let args = arguments(
    document_info(style, faculty, lang, document),
    none,
    title,
    author_info(author, author_pronouns, programme, specialization, year_of_study),
    project_info(supervisor, consultant),
    abstract_info(none, none),
    none,
    assignment,
    "",
  );
  check_arguments(args);
  import "utils.typ": assert_in_dict, assert_type_signature
  import "classic/classic.typ": title_pages_classic
  let title_pages = (
    classic: title_pages_classic,
  );
  assert_in_dict(style, title_pages, "template name");

  import "lang.typ": lang_ids
  assert_in_dict(lang, lang_ids, "language abbreviation");
  set text(lang: lang);

  title_pages.at(style)(args);
}

// Make a new abbreviation
//
// - abbreviation (str): The abbreviation
// - text (str): Optionally, the text - the meaning of the abbreviation.
#let abbr(abbreviation, ..text) = {
  import "abbreviations.typ": abbr
  return abbr(abbreviation, if text.pos().len() == 0 { none } else { text.pos().at(0) });
}
