import { serializeContext, deserializeContext } from './Util'
import { useRef, useState, ChangeEvent, MouseEvent, FormEvent } from 'react'
import { MqttClient, QoS, MqttConnection, PublishMessage, SubscribeTopic, ReceivedMessage, MqttClientProps } from './MqttClient'
import './App.css'

function App() {

  const DEFAULT_MQTT_CONNECTION : MqttConnection = {
    url: import.meta.env.VITE_MQTT_URL,
    clientId: 'OasizMqttClient_' + Math.random().toString(16).substr(2, 8),
    username: '',
    password: ''
  };

  const DEFAULT_PUBLISH_MESSAGE : PublishMessage = {
    topic: 'testtopic/1',
    payload: '',
    qos: 0,
    isRetain: false
  };

  const DEFAULT_ADD_SUBSCRIBE_TOPIC : SubscribeTopic = {
    name: "additional/subscribe/topic",
    qos: 0
  };

  const DEFAULT_SUBSCRIBING_TOPIC : Map<string, SubscribeTopic> =
      new Map<string, SubscribeTopic>([["testtopic/#", { name: "testtopic/#", qos: 0 }]]);

  const DEFAULT_RECEIVED_MESSAGES : Array<ReceivedMessage> = [];

  const DEFAULT_MQTT_CONTEXT: MqttClientProps = {
    INITIAL_CONNECTION: DEFAULT_MQTT_CONNECTION,
    INITIAL_PUBLISH_MESSAGE: DEFAULT_PUBLISH_MESSAGE,
    INITIAL_ADD_SUBSCRIBE_TOPIC: DEFAULT_ADD_SUBSCRIBE_TOPIC,
    INITIAL_SUBSCRIBING_TOPICS: DEFAULT_SUBSCRIBING_TOPIC,
    INITIAL_RECEIVED_MESSAGES: DEFAULT_RECEIVED_MESSAGES,
  }

  const FIRST_MQTT_CONTEXT: MqttClientProps = {
    ...DEFAULT_MQTT_CONTEXT,
    INITIAL_CONNECTION: {...DEFAULT_MQTT_CONNECTION,
      username: 'pubuser',
      password: 'password',
    }
  }

  const SECOND_MQTT_CONTEXT: MqttClientProps = {
    ...DEFAULT_MQTT_CONTEXT,
    INITIAL_CONNECTION: {...DEFAULT_MQTT_CONNECTION,
      username: 'subuser',
      password: 'password',
    },
    INITIAL_SUBSCRIBING_TOPICS: new Map<string, SubscribeTopic>(
      [
        ["testtopic1/#", { name: "testtopic1/#", qos: 0 }],
        ["testtopic2/#", { name: "testtopic2/#", qos: 2 }],
      ]),
    INITIAL_RECEIVED_MESSAGES: [
      { topic: "testtopic1/1", payload: "test" },
      { topic: "testtopic1/2", payload: "tetest" },
      { topic: "testtopic2/1", payload: "tetest" },
    ],
  }

  const mqttClient = useRef(null);

  const handleChangeContext = (event: MouseEvent<HTMLAnchorElement>, contextName: string) => {
    event.preventDefault();
    console.debug(`handleChangeContext: ${contextName}`);

    let currentMqttClient : any = mqttClient.current;
    let currentContext : MqttClientProps = currentMqttClient.getCurrentContext();
    currentMqttClient.end();
    saveContext(contextNameToAdd, currentContext);

    let newContext = mqttContexts.get(contextName) || DEFAULT_MQTT_CONTEXT;
    setCurrentMqttContext((prevContext) => newContext);
    setContextNameToAdd(contextName);
  }

  // State のリフトアップを行うと MqttClient 単体で使用することができなくなるため、
  // Context の保存時に MqttClient に問い合わせる形をとっている。
  // ...と思ったが、リフトアップしたうえで MqttClient を以下 4 パーツに分割する方が筋がいいかも？
  // - Connecion
  // - PublishMessage
  // - SubscribingTopics(addSubTopic含む)
  // - ReceivedMessages
  // ちょっと考える。
  const handleSaveContext = (event : FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.debug('handleSaveContext');

    if (!mqttClient.current) return;
    let currentMqttClient : any = mqttClient.current;
    let currentContext : MqttClientProps = currentMqttClient.getCurrentContext();
    currentMqttClient.end();

    saveContext(contextNameToAdd, currentContext);
  }

  const saveContext = (contextName: string, newContext: MqttClientProps) => {
    console.debug('saveContext');

    if (contextName === '') return;

    setMqttContexts((prevContexts) => {
      let newMap = new Map<string, MqttClientProps>(prevContexts);
      newMap.set(contextName, newContext);

      localStorage.setItem('contexts', serializeContext(newMap));

      return newMap;
    });
  }

  const handleChangeSaveContextName = (event : ChangeEvent<HTMLInputElement>) => {
    let newValue = event.currentTarget.value || '';
    console.debug(`handleChangeSaveContextName: ${newValue}`);
    setContextNameToAdd(newValue);
  };

  const [currentMqttContext, setCurrentMqttContext] = useState<MqttClientProps>(DEFAULT_MQTT_CONTEXT);

  const initialContexts = () => {
    let contexts = localStorage.getItem('contexts');
    return contexts ?
      new Map<string, MqttClientProps>(deserializeContext(contexts))
      :
      new Map<string, MqttClientProps>([]);

  }

  const [mqttContexts, setMqttContexts] = useState<Map<string, MqttClientProps>>(initialContexts());
  const [contextNameToAdd, setContextNameToAdd] = useState('');

  return (
    <div className="App">
      <h1>contexts:</h1>
      <ol>
        {[...mqttContexts.keys()].map((key) => <li key={key}><a href="#" onClick={(event) => handleChangeContext(event, key)}>{key}</a></li>)}
      </ol>
      <form onSubmit={handleSaveContext}>
        <label>Context Name: </label><input type="text" name="name" onChange={handleChangeSaveContextName} value={contextNameToAdd}></input>
        <button type="submit" disabled={false}>save context</button>
      </form>
      <MqttClient ref={mqttClient} key={JSON.stringify(currentMqttContext)} {...currentMqttContext}></MqttClient>
    </div>
  )
}

export default App
