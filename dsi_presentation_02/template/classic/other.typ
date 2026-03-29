#import "../lang.typ": get_lang_item
#import "common.typ": (
  abbrlist, abstract, assignment, bibliogr, default_styling, disclaimer, imagelist, mainpage,
  tablelist, toc,
)
#import "../attachments.typ": attachment_list
#import "../utils.typ": assert_dict_has, assert_in_arr, assert_not_none, is_none, ok_or
#import "../arguments.typ": get_arg, map_arg, req_arg
#import "../theme.typ": faculty_color

#let other_title_page(args) = {
  if req_arg(args, "document.content_only") {
    return
  }
  let language = req_arg(args, "document.language")
  let title = get_arg(args, "title")
  map_arg(args, "title", v => { assert_dict_has((language,), v, "title") })
  mainpage(args)
}

#let other_base(args, content) = {
  let language = req_arg(args, "document.language")
  let bonding_type = ok_or(get_arg(args, "document.bonding_style"), "none")

  default_styling(
    bonding_type,
    faculty_color(req_arg(args, "document.faculty")),
    {
      if not req_arg(args, "document.content_only") {
        toc(language)
        tablelist(language)
        imagelist(language)
        abbrlist(language)
        pagebreak(to: "even", weak: true)
      } else {
        abbrlist(language, hidden: true)
      }
      content
      bibliogr(args)
      attachment_list(language)
    },
    language,
  )
}
