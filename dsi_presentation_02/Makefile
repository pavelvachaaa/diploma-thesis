THESIS_FILE := thesis
TYPST_FONTPATH := --font-path template/fonts

.PHONY: watch
watch: $(THESIS_FILE).pdf
	xdg-open $< & typst watch $(TYPST_FONTPATH) $(THESIS_FILE).typ

.PHONY: view
view: $(THESIS_FILE).pdf
	xdg-open $<

.PHONY: %.pdf
%.pdf: %.typ
	typst compile $(TYPST_FONTPATH) $<
