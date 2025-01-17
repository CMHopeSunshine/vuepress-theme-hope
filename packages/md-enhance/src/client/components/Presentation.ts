import { useReveal } from "@temp/md-enhance/reveal";
import { usePageFrontmatter } from "@vuepress/client";
import { defineComponent, h, onBeforeUnmount, onMounted, ref } from "vue";
import { LoadingIcon, atou } from "vuepress-shared/client";

import type { PropType, VNode } from "vue";
import type Reveal from "reveal.js/dist/reveal.esm.js";
import type { RevealOptions } from "reveal.js/dist/reveal.esm.js";

declare const MARKDOWN_ENHANCE_DELAY: number;
declare const REVEAL_CONFIG: Partial<RevealOptions>;

type ThemeType =
  | "auto"
  | "black"
  | "white"
  | "league"
  | "beige"
  | "sky"
  | "night"
  | "serif"
  | "simple"
  | "solarized"
  | "blood"
  | "moon";

import "../styles/slides/index.scss";
import "../styles/slides/theme/fonts/league-gothic/league-gothic.css";
import "../styles/slides/theme/fonts/source-sans-pro/source-sans-pro.css";

export default defineComponent({
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Presentation",

  props: {
    /**
     * Presentation id
     *
     * 幻灯片 id
     */
    id: { type: String, required: true },

    /**
     * Presentation code
     *
     * 幻灯片代码
     */
    code: { type: String, required: true },

    /**
     * Presentation theme
     *
     * 幻灯片主题
     */
    theme: { type: String as PropType<ThemeType>, default: "auto" },
  },

  setup(props) {
    const frontmatter = usePageFrontmatter<{ reveal: RevealOptions }>();
    const code = ref("");
    const loading = ref(true);
    const presentationContainer = ref<HTMLElement>();

    let reveal: Reveal;

    onMounted(() => {
      const container = presentationContainer.value;

      if (container) {
        code.value = atou(props.code);

        container.setAttribute("id", props.id);
        container.setAttribute("data-theme", props.theme);

        const promises: [
          Promise<void>,
          ...Promise<typeof import("reveal.js/dist/reveal.esm.js")>[]
        ] = [
          new Promise((resolve) => setTimeout(resolve, MARKDOWN_ENHANCE_DELAY)),
          ...useReveal(),
        ];

        void Promise.all(promises).then(([, revealJS, ...plugins]) => {
          reveal = new revealJS.default(container, {
            plugins: plugins.map((plugin) => plugin.default),
          });

          void reveal
            .initialize({
              backgroundTransition: "slide",
              hash: frontmatter.value.layout === "Slide",
              mouseWheel: frontmatter.value.layout === "Slide",
              transition: "slide",
              slideNumber: true,
              ...REVEAL_CONFIG,
              ...(frontmatter.value.reveal || {}),
              embedded: frontmatter.value.layout !== "Slide",
            })
            .then(() => {
              loading.value = false;
              reveal.configure({ backgroundTransition: "slide" });
            });
        });
      }
    });

    onBeforeUnmount(() => {
      reveal?.destroy();
    });

    return (): VNode =>
      h("div", { class: "presentation-wrapper" }, [
        h(
          "div",
          {
            ref: presentationContainer,
            class: ["reveal", "reveal-viewport"],
          },
          h("div", {
            class: "slides",
            // style: { display: loading.value ? "none" : "block" },
            innerHTML: `<section data-markdown data-separator="^\\r?\\n---\\r?\\n$" data-separator-vertical="^\\r?\\n--\\r?\\n$"><script type="text/template">${code.value}</script></section>`,
          })
        ),
        loading.value
          ? h(LoadingIcon, { class: "reveal-loading", height: 400 })
          : null,
      ]);
  },
});
