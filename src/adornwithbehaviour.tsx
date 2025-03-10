import { PropertyType, RoleInstanceT, RoleType } from "perspectives-proxy";
import React, { createRef } from "react";
import { EventDispatcher, PSRol, PSRolType } from "./reactcontexts";
import { BehaviourAdder } from "./cardbehaviour";

/*
  Do not use this component to add behaviour to a Card.
  Instead, use the AdorningComponentWrapper component.
  This component is used by the AdorningComponentWrapper component.
*/

export interface CardProperties {
  title: string;
  labelProperty: PropertyType;
}

export interface AdornWithBehaviourProps {
  viewname?: string;
  cardprop?: PropertyType;
  setEventDispatcher: (dispatcher: EventDispatcher) => void;
  myroletype: RoleType;
  systemExternalRole: RoleInstanceT;
  
  title: string;
  labelProperty: PropertyType;

  addedBehaviour: BehaviourAdder[];
  Card: React.ComponentType<CardProperties>;
}

export class AdornWithBehaviour extends React.Component<AdornWithBehaviourProps>
{
  ref: React.RefObject<HTMLDivElement | null>;
  prevRef?: HTMLDivElement | null;
  addedBehaviour: string[];
  declare context: PSRolType;
  static contextType = PSRol
  
  constructor(props: AdornWithBehaviourProps) {
    super(props);
    this.ref = createRef();
    this.addedBehaviour = [];
  }

  componentDidMount() {
    const component = this;
    const domEl = this.ref.current;
    // Save for componentDidUpdate, so we can see if we need to re-establish behaviour.
    component.prevRef = domEl;
    // Add behaviour to the div DOM element.
    this.props.addedBehaviour.forEach(behaviour => behaviour(domEl!, this));
  }

  componentDidUpdate() {
    const component = this;
    const domEl = this.ref.current;
    if (component.prevRef !== domEl) {
      // Do behaviour again.
      this.props.addedBehaviour.forEach(behaviour => behaviour(domEl!, this));
    }
  }

  render() {
    const component = this;
    return (
      <div ref={component.ref}>
        <this.props.Card title={this.props.title} labelProperty={this.props.labelProperty} />
      </div>
    );
  }
}