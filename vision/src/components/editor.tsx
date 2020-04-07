/**
 * Generic component for editing or writing
 * 
 * Can be used for real-time collaboration (ie, think notepad or google docs) or for writing new
 * content for a blog or post
 */

import React, { useState, useEffect } from "react";
import markdown from "markdown-it";
import hljs from "highlight.js";
import dp from "dompurify";

import { State } from "../state/store";
import { WebComm } from "../state/communication";
import { SubTabNav } from "../components/tabnav";
import { SubTab } from "../components/tab";
import { logger } from "../logger";

const md = markdown("default", {
  highlight: (content: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        let result = hljs.highlight(lang, content).value;
        console.log("Using syntax highlighting");
        return result
      } catch (__) {}
    }

    return ''; // use external default escaping
  }
});

export const Editor: React.FC<{ webcomm: WebComm }> = (props) => {
  const [content, setContent] = useState("");
  const [activeSubTab, setSubTab] = useState("raw");
  const ref: React.RefObject<HTMLDivElement> = React.createRef();

  const target: React.RefObject<HTMLTextAreaElement> = React.createRef()

  const dataHandler = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!target.current) return
    setContent(evt.target.value)
  }

  const send = (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {

  }

  const setEditActive = (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setSubTab("raw");
  }

  const setPreviewActive = (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (!ref.current) return
    const dirty = md.render(content);
    const clean = dp.sanitize(dirty);
    ref.current.innerHTML = clean;

    hljs.initHighlighting();
    setSubTab("preview");
  }

  return (
    <SubTabNav webcomm={ props.webcomm } className="tab-nav">
      <SubTab active={ activeSubTab === "raw" } name="raw">
        <textarea className="editor-text"
              cols={ 1 }
              wrap={ "hard" }
              ref={ target }
              onInput={ dataHandler } />
      </SubTab>
      <SubTab active={ activeSubTab === "preview" } name="preview">
        <div ref={ ref }></div>
      </SubTab>
      <div className="tab-buttons">
        <div className="justify-left">
          <button onClick={ setEditActive }>
            Edit
          </button>
          <button onClick={ setPreviewActive }>
            Preview
          </button>
        </div>
        <div className="justify-right">
          <button onClick={ send }>
            Send
          </button>
        </div>
      </div>
    </SubTabNav>
  )
}