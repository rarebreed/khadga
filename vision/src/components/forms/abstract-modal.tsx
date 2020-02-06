import React from "react";
import { ModalState } from "../../state/types";

const logger = console;

export interface ModalBaseProps {
  children?: React.ReactNode,
	bulma: string,
	modal: ModalState
}

export abstract class AbstractModal<T extends ModalBaseProps> extends React.Component<T> {
  abstract setActive = (_: React.MouseEvent<HTMLButtonElement>): void => {
    return;
  }

  abstract cancel = (_: React.MouseEvent<HTMLAnchorElement>): void => {
		// this.props.setActive(false);
		return;
	}

	abstract submit = async (_: React.MouseEvent<HTMLAnchorElement>): Promise<void> => {
		return;
  }

  abstract getActive = (): boolean => {
    return false;
  }

  render() {
    const className = "modal" + (this.getActive() ? ` is-active` : "");
    return (
      <div className={className}>
        <div className="modal-background"></div>
        <div className="modal-content">
            {this.props.children}

            <div className="field is-grouped">
              <p className="control">
                <a className="button is-primary"
                  onClick={this.submit}>
                  Submit
                </a>
              </p>
              <p className="control">
                <a className="button is-light"
                  onClick={this.cancel}>
                  Cancel
                </a>
              </p>
            </div>
        </div>

        <button
          className="modal-close is-large"
          aria-label="close"
          onClick={this.setActive}>
        </button>
      </div>
    );
  }
}