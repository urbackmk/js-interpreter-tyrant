import React, {Component} from 'react';
import TyrantEventQueue, {Events} from '../client/TyrantEventQueue';
import styled from 'styled-components';
import {grey} from 'material-ui/colors';

const Wrapper = styled.div`
  padding: 10px;
  background-color: ${grey[800]};
  min-height: 100px;
  max-height: 350px;
  overflow: scroll;
  pre {
    margin: 0px;
    span {
      font-size: smaller;
    }
    white-space: pre-wrap;
    color: white;
    .timestamp {
      color: ${grey[500]};
    }
  }
`;

function formatMessage(message) {
  while (message[0] === '\n') {
    message = message.slice(1);
  }
  return message;
}

export default class LogOutput extends Component {
  onLogVersionChange = () =>
    this.setState({
      logVersion: TyrantEventQueue.getVersion([Events.LOG, Events.WRITE]),
    });

  componentDidMount() {
    TyrantEventQueue.on(Events.LOG, this.onLogVersionChange).on(
      Events.WRITE,
      this.onLogVersionChange
    );
  }

  componentWillUnmount() {
    TyrantEventQueue.removeEventListener(Events.LOG, this.onLogVersionChange);
  }

  getMessages = () => {
    const nodes = [];
    let lastEvent = null;
    function renderLastEvent() {
      const {timestamp, eventId, data: {message}} = lastEvent;
      nodes.push(
        <pre key={eventId}>
          <span className="timestamp">
            {timestamp.format('HH:mm:ss.SSS')}:
          </span>{' '}
          {formatMessage(message)}
        </pre>
      );
    }
    TyrantEventQueue.getEvents().forEach(event => {
      if (![Events.LOG, Events.WRITE].includes(event.eventName)) {
        return;
      }
      const {eventName, data: {message}} = event;
      if (
        eventName === Events.LOG ||
        (eventName === Events.WRITE && !lastEvent)
      ) {
        // make sure we "complete" the last log entry
        if (lastEvent) {
          renderLastEvent();
        }
        lastEvent = event;
      } else if (eventName === Events.WRITE && lastEvent) {
        lastEvent.data.message += message;
      }
    });

    if (lastEvent) {
      renderLastEvent();
    }
    return nodes;
  };

  render() {
    return (
      <Wrapper>
        {this.getMessages()}
      </Wrapper>
    );
  }
}
