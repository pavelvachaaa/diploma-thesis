#import "../theme.typ": faculty_color
#import "../arguments.typ": get_arg, req_arg
#import "../utils.typ": is_none, assert_dict_has
#import "common.typ": (
  default_styling,
  disclaimer,
  abstract,
  acknowledgement,
  toc,
  tablelist,
  imagelist,
  abbrlist,
  bibliogr,
)
#import "../attachments.typ": attachment_list

#let force_langs = ("cs", "en");

#let thesis_base(args, content, show_disclaimer: true, require_abstract: true) = {
  assert_dict_has(force_langs, req_arg(args, "title"), "title");
  if require_abstract {
    assert_dict_has(force_langs, req_arg(args, "abstract.content"), "abstract");
    assert_dict_has(force_langs, req_arg(args, "abstract.keywords"), "keywords");
  }

  let language = req_arg(args, "document.language");
  default_styling(false, faculty_color(req_arg(args, "document.faculty")), {
    if show_disclaimer and is_none(get_arg(args, "title_pages")) {
      disclaimer(args);
    }
    abstract("cs", args, require: require_abstract);
    abstract("en", args, require: require_abstract);
    acknowledgement(args);
    toc(language);
    tablelist(language);
    imagelist(language);
    abbrlist(language);
    pagebreak(weak: true);
    content;
    bibliogr(args);
    attachment_list(language);
  }, language);
}

#let thesis_base_title_pages(args) = {
  let language = req_arg(args, "document.language");
  default_styling(false, faculty_color(req_arg(args, "document.faculty")), {
    if is_none(get_arg(args, "title_pages")) {
      disclaimer(args);
    }
  }, language);
}
