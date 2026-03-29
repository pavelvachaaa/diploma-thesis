#import "utils.typ": assert_type_signature, is_none
#import "lang.typ": get_lang_item

#let attachment_data = state("attachment_data");

#let attach_link(name, link) = {
  assert_type_signature(link, "string", "attach link argument");
  assert_type_signature(name, "string", "attach link name argument");
  ("link", link, name)
}

#let attach_content(name, inner_content) = {
  assert_type_signature(inner_content, "content", "attach content argument");
  assert_type_signature(name, "string", "attach content name argument");
  ("content", inner_content, name)
}

#let attach_pdf(name, filepath) = {
  assert_type_signature(filepath, "string", "attach pdf argument");
  assert_type_signature(name, "string", "attach pdf name argument");
  ("pdf", filepath, name)
}

#let attach_file_reference(name, filename) = {
  assert_type_signature(filename, "string", "attach file reference filename argument");
  assert_type_signature(name, "string", "attach file reference name argument");
  ("ref", filename, name)
}

#let make_content_anchor(idx) = {
  "attachment_" + str(idx + 1)
}

#let generate_attachment_content(attachment, idx) = {
  let attachment_type = attachment.at(0);
  if attachment_type == "content" {
    let anchor = make_content_anchor(idx);
    [#metadata(attachment.at(1)) #label(anchor)];
  }
}

#let generate_attachment_info(attachment, idx) = {
  let attachment_type = attachment.at(0);
  if type(attachment_type) != str {
    panic("invalid attachment - wrap the attach using: attach_content, attach_pdf, ...");
  }
  if attachment_type == "content" {
    let anchor = make_content_anchor(idx);
    "(\"content\",\"" + anchor + "\",\"" + attachment.at(2) + "\")"
  } else if attachment_type == "pdf" {
    "(\"pdf\",\"" + attachment.at(1) + "\",\"" + attachment.at(2) + "\")"
  } else if (
    attachment_type == "pdf" or
    attachment_type == "link" or
    attachment_type == "ref"
  ) {
    "(" + attachment.map((v) => { "\"" + v + "\"" }).join(",") + ",)"
  } else {
    panic("unknown attachment type '" + attachment_type + "'");
  }
}

#let attachments(..attachments) = {
  let attachments = attachments.pos();
  assert_type_signature(
    attachments, "array[array[string | content]] | array[string | content]", "attachments"
  );
  context {
    if not is_none(attachment_data.get()) {
      panic("re-definition of attachments - attachments must only be defined once");
    }
    if attachments.len() == 0 {
      attachment_data.update("false");
    } else {
      attachment_data.update({
        "(" + if type(attachments) == array and type(attachments.at(0)) == array {
          for (idx, attachment) in attachments.enumerate() {
            (generate_attachment_info(attachment, idx),)
          }.join(", ")
        } else {
          generate_attachment_info(attachments, 0)
        } + ",)"
      })
      if type(attachments) == array and type(attachments.at(0)) == array {
        for (idx, attachment) in attachments.enumerate() {
          generate_attachment_content(attachment, idx);
        }
      } else {
        generate_attachment_content(attachments, 0);
      }
    }
  }
}

#let list_entry(language, entry, is_embedded) = {
  let entry_type = entry.at(0);
  entry.at(2);
  if entry_type == "link" {
    ": ";
    link(entry.at(1));
  } else if entry_type == "ref" {
    ": soubor ";
    raw(entry.at(1));
  }
  if is_embedded {
    text(
      " (" + get_lang_item(language, "attached_bellow") + ")",
      style: "italic",
      fill: black.lighten(50%),
    );
  }
}

#let attachment_list(language) = {
  context {
    let data = attachment_data.get();
    if is_none(data) {
      return;
    }
    let data = eval(data);
    if data == false {
      return;
    }
    heading(get_lang_item(language, "attachments"), numbering: none);

    // listing
    let has_embedded = false;
    let enum_items = ();
    for attachment in data {
      let attachment_type = attachment.at(0);
      let is_embedded = false;
      if attachment_type == "content" or attachment_type == "pdf" {
        has_embedded = true;
        is_embedded = true;
      }
      enum_items.push(list_entry(language, attachment, is_embedded));
    }
    enum(..enum_items.map((v) => { enum.item(v) }), spacing: 1em);

    if has_embedded {
      pagebreak(weak: true);
    }

    // embedded
    set page(footer: none);
    for (idx, attachment) in data.enumerate() {
      let attachment_type = attachment.at(0);
      if attachment_type == "content" {
        heading(
          level: 2,
          get_lang_item(language, "attachment") + " " + str(idx + 1),
          numbering: none,
          outlined: false,
        );
        query(label(attachment.at(1))).at(0).value;
      } else if attachment_type == "pdf" {
        import "./pdf.typ": embed_full
        page(place(center + horizon, heading(
          level: 2,
          get_lang_item(language, "attachment") + " " +
          str(idx + 1) + " " +
          get_lang_item(language, "next_page_attachment"),
          numbering: none,
          outlined: false,
        )), margin: 0em);
        set page(margin: 0em);
        embed_full(read("../" + attachment.at(1), encoding: none));
      }
    }
  }
}
