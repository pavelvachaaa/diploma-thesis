#import "lang.typ": lang_id
#import "utils.typ": assert_in_dict

#let faculty_themes = (

    tul: (
      cmyk(80%, 81%, 0%, 0%),
      (
        "TECHNICKÁ UNIVERZITA V LIBERCI&",
        "TECHNICAL UNIVERSITY OF LIBEREC&",
      ),
    ),

    fs: (
      cmyk(45%, 35%, 30%, 10%),
      (
        "FAKULTA STROJNÍ TUL&",
        "FACULTY OF MECHANICAL ENGINEERING TUL&",
      ),
    ),

    ft: (
      cmyk(0%, 65%, 100%, 40%),
      (
        "FAKULTA TEXTILNÍ TUL&",
        "FACULTY OF TEXTILE ENGINEERING TUL&",
      ),
    ),

    fp: (
      cmyk(90%, 40%, 0%, 0%),
      (
        "FAKULTA\nPŘÍRODOVĚDNĚ-HUMANITNÍ\nA PEDAGOGICKÁ TUL&",
        "FACULTY OF SCIENCE,\nHUMANITIES AND\nEDUCATION TUL&",
      ),
    ),

    ef: (
      cmyk(60%, 0%, 100%, 0%),
      (
        "EKONOMICKÁ FAKULTA TUL&",
        "FACULTY OF ECONOMICS TUL&",
      ),
    ),

    fua: (
      cmyk(96%, 2%, 80%, 47%),
      (
        "FAKULTA UMĚNÍ A ARCHITEKTURY TUL&",
        "FACULTY OF ARTS AND ARCHITECTURE TUL&",
      ),
    ),

    fm: (
      cmyk(0%, 60%, 100%, 0%),
      (
        "FAKULTA MECHATRONIKY,\nINFORMATIKY A MEZIOBOROVÝCH\nSTUDIÍ TUL&",
        "FACULTY OF MECHATRONICS,\nINFORMATICS AND\nINTERDISCIPLINARY STUDIES TUL&",
      ),
    ),

    fzs: (
      cmyk(90%, 0%, 30%, 0%),
      (
        "FAKULTA ZDRAVOTNICKÝCH STUDIÍ TUL&",
        "FACULTY OF HEALTH STUDIES TUL&",
      ),
    ),

    cxi: (
      cmyk(0%, 100%, 100%, 0%),
      (
        "ÚSTAV PRO NANOMATERIÁLY,\nPOKROČILÉ TECHNOLOGIE\nA INOVACE TUL&",
        "INSTITUTE FOR NANOMATERIALS,\nADVANCED TECHNOLOGY\nAND INNOVATION TUL&",
      ),
    ),

);

#let faculty_theme(faculty_id) = {
  assert_in_dict(faculty_id, faculty_themes, "faculty abbreviation");
  return faculty_themes.at(faculty_id)
}

#let faculty_color(faculty_id) = {
  let theme = faculty_theme(faculty_id);
  let theme_color = theme.at(0);
  assert(type(theme_color) == color);
  return theme_color;
}

#let faculty_logotype_text(faculty_id, lang) = {
  let theme = faculty_theme(faculty_id);
  let logotype_text = theme.at(1).at(lang_id(lang));
  assert(type(logotype_text) == str);
  return logotype_text;
}

#let faculty_logotype(faculty_id, lang) = {
  let theme_color = faculty_color(faculty_id);
  let logotype_text = faculty_logotype_text(faculty_id, lang);
  text(logotype_text, font: "TUL Mono", theme_color, weight: "black");
}

#let tul_logomark(faculty_id) = {
  let theme_color = faculty_color(faculty_id);
  let image_raw = bytes(read("./assets/tul_logo.svg").replace("black", theme_color.to-hex()));
  image(image_raw, fit: "contain")
}
