/**
 * Generic component for editing or writing
 * 
 * Can be used for real-time collaboration (ie, think notepad or google docs) or for writing new
 * content for a blog or post
 */

import React, { useState, useEffect, useRef } from "react";
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
        return result
      } catch (__) {}
    }

    return ''; // use external default escaping
  }
});

export const Editor: React.FC<{ webcomm: WebComm }> = (props) => {
  const [content, setContent] = useState("");
  const [activeSubTab, setSubTab] = useState("raw");

  //const textAreaRef_: React.RefObject<HTMLDivElement> = React.createRef();
  //const textTarget: React.RefObject<HTMLTextAreaElement> = React.createRef();
  const textAreaRef = useRef<HTMLDivElement>(null);
  const textTarget = useRef<HTMLTextAreaElement>(null)

  const dataHandler = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!textTarget.current) return
    setContent(evt.target.value)
  }

  const send = (evt: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    alert("TODO: Send blog to database");
  }

  const setEditActive = (evt: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    setSubTab("raw");
  }

  const setPreviewActive = (evt: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (!textAreaRef.current) return
    console.log(content)
    const dirty = md.render(content);
    const clean = dp.sanitize(dirty);
    console.log(clean);
    textAreaRef.current.innerHTML = clean;

    hljs.initHighlighting();
    setSubTab("preview");
  }

  return (
    <SubTabNav webcomm={ props.webcomm } className="tab-nav">
      <div className="editor-section justify-top">
        <SubTab active={ activeSubTab === "raw" } name="raw">
          <textarea className="editor-text"
                cols={ 1 }
                rows={ 1 }
                wrap={ "hard" }
                ref={ textTarget }
                placeholder="You can write markdown here"
                onInput={ dataHandler } />
        </SubTab>
        <SubTab active={ activeSubTab === "preview" } name="preview">
          <div ref={ textAreaRef }></div>
        </SubTab>
      </div>
      <div className="button-section justify-bottom">
        <div className="navsection">
          <div className="tab-button-group justify-left">
            <a className="panelbtn" onClick={ setEditActive } href="#">
              Edit
            </a>
            <a className="panelbtn" onClick={ setPreviewActive } href="#">
              Preview
            </a>
          </div>
          <div className="tab-button-group justify-right">
            <a className="panelbtn" onClick={ send } href="#">
              Send
            </a>
          </div>
        </div>
      </div>
    </SubTabNav>
  )
}