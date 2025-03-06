import { PropertyType } from "perspectives-proxy";
import React from "react";
import { AppContext, PSContext } from "./reactcontexts";
import { AdornWithBehaviour } from "./adornwithbehaviour";
import { CardProperties, getBehaviourAdder } from "./cardbehaviour";

/*
  Use this component to wrap a card component with behaviour.
  The behaviour is determined by the behaviourNames array.
  The title and labelProperty are passed to the Card component.
  The Card component is passed as a prop.
*/

interface AdorningComponentWrapperProps {
  title: string;
  labelProperty: PropertyType;
  behaviourNames: string[];
  Card: React.ComponentType<CardProperties>;
}

export const AdorningComponentWrapper: React.FC<AdorningComponentWrapperProps> = ({ title, labelProperty, Card, behaviourNames }) => {
  const addedBehaviour = behaviourNames.map(getBehaviourAdder);

  return (
    <PSContext.Consumer>
      {pscontext => (
        <AppContext.Consumer>
          {appcontext => (
              <AdornWithBehaviour 
                title={title}
                labelProperty={labelProperty}
                Card={Card}
                systemExternalRole={appcontext.systemExternalRole}
                myroletype={pscontext.myroletype}
                setEventDispatcher={appcontext.setEventDispatcher}
                addedBehaviour={addedBehaviour}
              />
          )}
        </AppContext.Consumer>
      )}
    </PSContext.Consumer>
  );

}

////////////////////////////////////////////
//// A HOC to add behaviours to a card component
////////////////////////////////////////////
interface WithBehavioursProps extends CardProperties {
  behaviourNames: string[];
}

// Wraps a component with CardProperties and produces a component that takes behaviourNames, title an labelProperty as props.
export const cardWithConfigurableBehaviour = (WrappedComponent: React.ComponentType<CardProperties>) => {
  return ({ behaviourNames, ...props }: WithBehavioursProps) => {
    return (
      <AdorningComponentWrapper
        behaviourNames={behaviourNames}
        {...props}
        Card={WrappedComponent}
      />
    );
  };
};

export const cardWithFixedBehaviour = (WrappedComponent: React.ComponentType<CardProperties>, behaviourNames: string[]) => {
  return (props: CardProperties) => {
    return (
      <AdorningComponentWrapper
        behaviourNames={behaviourNames}
        {...props}
        Card={WrappedComponent}
      />
    );
  };
}