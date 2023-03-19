import { useRef, useState, FormEvent, ChangeEvent, Fragment } from 'react'
import './App.css'
import * as MQTT from 'mqtt';
import { IPacket } from 'mqtt-packet';

function App() {

  type QoS = 0 | 1 | 2;

  type SubscribingTopic = {
    name: string;
    qos: QoS;
  };

  const clientRef = useRef<MQTT.MqttClient|null>(null)
  const [mqttUrl, setMqttUrl] = useState(import.meta.env.VITE_MQTT_URL)
  const [mqttClientId, setMqttClientId] = useState('mqttjs_' + Math.random().toString(16).substr(2, 8))
  const [mqttUserName, setMqttUserName] = useState('')
  const [mqttPassword, setMqttPassword] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [connectError, setConnectError] = useState('')
  const [publishTopic, setPublishTopic] = useState("testtopic/1")
  const [publishMessage, setPublishMessage] = useState("")
  const [publishQos, setPublishQos] = useState<QoS>(0)
  const [isRetain, setRetain] = useState(false)
  const [receivedMessages, setReceivedMessages] = useState<Array<string>>([])
  const [addSubscribingTopic, setAddSubscribingTopic] = useState("additional/subscribe/topic")
  const [subscribeQos, setSubscribeQos] = useState<QoS>(0)
  const [subscribingTopics, setSubscribingTopics] = useState<Map<string, SubscribingTopic>>(new Map<string, SubscribingTopic>([["testtopic/#", { name: "testtopic/#", qos: 0 }]]))

  const KEEPALIVE_TIME = 30;

  const connect = () => {
    console.debug('start connect');
    if (!isConnected) {
      // クライアントインスタンスの作成
      let newClient = MQTT.connect(mqttUrl, {
        clientId: mqttClientId,
        username: mqttUserName,
        password: mqttPassword,
        keepalive: KEEPALIVE_TIME
      });

      console.debug(`connecting ${mqttUrl}...`);

      newClient.on('connect', () => {
        console.debug(`connected ${mqttUrl}`);

        subscribingTopics.forEach(topic => {
          console.debug(`start subscribe "${JSON.stringify(topic)}"`);
          newClient.subscribe(topic.name, { qos: topic.qos });
        });

        // エラーメッセージ削除
        setConnectError((prevError) => '');
        setIsConnected(true);
      });

      newClient.on('error', (error) => {
        console.debug(`error: ${mqttUrl} connct failed. ${error.message}`);

        // エラーメッセージ設定
        setConnectError((prevError) => error.message);

        // connect 時のエラーの際は、再接続せずに終了する
        newClient.end();
      });

      newClient.on('message', (topic: string, payload: Buffer, packet: IPacket) => {
        let newMessage = `${topic} : ${payload.toString()}`;
        console.debug(`onmessage: ${newMessage}`);
        setReceivedMessages(prevMessages => prevMessages.concat([newMessage]));
      });

      clientRef.current = newClient;
    }
  };

  const disconnect = () => {
    console.debug(`disconnect: ${mqttUrl}`);
    if (clientRef.current) {
      clientRef.current.end();
    }
    setIsConnected(false);
  };

  const handleChangeMqttUrl = (event : ChangeEvent<HTMLInputElement>) => {
    let newValue = event.currentTarget.value;
    console.debug(`handleChangeMqttUrl: ${newValue}`);
    setMqttUrl(newValue || '');
  };

  const handleChangeMqttClientId = (event : ChangeEvent<HTMLInputElement>) => {
    let newValue = event.currentTarget.value;
    console.debug(`handleChangeMqttClientId: ${newValue}`);
    setMqttClientId(newValue || '');
  };

  const handleChangeMqttUserName = (event : ChangeEvent<HTMLInputElement>) => {
    let newValue = event.currentTarget.value;
    console.debug(`handleChangeMqttUserName: ${newValue}`);
    setMqttUserName(newValue || '');
  };

  const handleChangeMqttPassword = (event : ChangeEvent<HTMLInputElement>) => {
    let newValue = event.currentTarget.value;
    console.debug(`handleChangeMqttPassword: ${newValue}`);
    setMqttPassword(newValue || '');
  };

  const handleConnect = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.debug(`handleConnect: ${mqttUrl}`);
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  const handleChangePublishMessage = (event : ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = event.currentTarget.value || '';
    console.debug(`handleChangePublishMessage: ${newValue}`);
    setPublishMessage(newValue);
  };

  const handleChangePublishQos = (event : ChangeEvent<HTMLInputElement>) => {
    console.debug(`handleChangePublishQos: ${event.currentTarget.value}`);

    let rawPublishQos = Number(event.currentTarget.value);

    // TODO: エラー表示
    setPublishQos(toQos(rawPublishQos));
  };

  const handleChangeRetain = (event : ChangeEvent<HTMLInputElement>) => {
    console.debug(`handleChangeRetain : ${event.currentTarget.checked}`);
    setRetain(event.currentTarget.checked);
  };

  const handleChangeSendTopic = (event : ChangeEvent<HTMLInputElement>) => {
    let newValue = event.currentTarget.value || '';
    console.debug(`handldeChangePublishMessage: ${newValue}`);
    setPublishTopic(newValue);
  };

  const handlePublishMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.debug('handlePublishMessage : ');
    console.debug(event);
    console.debug(`publishTopic: ${publishTopic}`);
    console.debug(`publishMessage: ${publishMessage}`);
    console.debug(`publishMessage QoS: ${publishQos}`);
    console.debug(`publishMessage retain: ${isRetain}`);
    console.debug(clientRef.current);
    if (clientRef.current) {
      let options = {
        QoS: publishQos,
        retain: isRetain
      };
      clientRef.current.publish(publishTopic, publishMessage, options)
    }
  };

  const handleChangeSubscribeTopic = (event : ChangeEvent<HTMLInputElement>) => {
    let newValue = event.currentTarget.value || '';
    console.debug(`handleChangeSubscribeTopic: ${newValue}`);
    setAddSubscribingTopic(prevTopic => newValue);
  };

  const handleChangeSubscribeQos = (event : ChangeEvent<HTMLInputElement>) => {
    console.debug(`handleChangeSubscribeQos : ${event.currentTarget.value}`);

    let rawPublishQos = Number(event.currentTarget.value);

    // TODO: エラー表示
    setSubscribeQos(toQos(rawPublishQos));
  };

  const handleSubmitAddSubscribeTopic = (event : ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.debug(`handleSubmitAddSubscribeTopic: ${addSubscribingTopic}, QoS: ${subscribeQos}`);
    if (clientRef.current) {
      clientRef.current.subscribe(addSubscribingTopic, { qos: subscribeQos });
    }
    setSubscribingTopics(prevTopics => {
      let newMap = new Map<string, SubscribingTopic>(prevTopics);
      newMap.set(addSubscribingTopic, { name: addSubscribingTopic, qos: subscribeQos });
      return newMap;
    });
  };

  const handleDeleteSubscribeTopic = (event : React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    let targetTopic = event.currentTarget.value;
    console.debug(`handleDeleteSubscribeTopic : ${targetTopic}`);
    if (clientRef.current) {
      clientRef.current.unsubscribe(targetTopic);
    }
    setSubscribingTopics(prevTopics => {
      let newMap = new Map<string, SubscribingTopic>(prevTopics);
      newMap.delete(targetTopic);
      return newMap;
    });
  };

  const toQos = (qos : number) : QoS  => {
    if (![0, 1, 2].includes(qos)) {
      throw new Error(`error: ${qos} は QoS の値として正しくありません(0 or 1 or 2)`);
    }
    return qos as QoS
  }

  return (
    <div className="App">
      <h1>OASIZ MQTT Client</h1>
      <section>
        <h2>Connection</h2>
        <div>
          <label>{
            isConnected ?
              `connected to ${mqttUrl}.`
              :
              "not connected."
          }</label>
        </div>
          {
            connectError !== '' ?
            <div><label>`Error: ${connectError}`</label></div>
              :
              <></>
          }
        <form onSubmit={handleConnect}>
          <label>URL: </label><input type="text" name="mqttUrl" onChange={handleChangeMqttUrl} value={mqttUrl}></input>
          <button type="submit" disabled={false}>{
            isConnected ?
              'disconnect'
              :
              'connect'
          }</button>
          <div><label>clientId: </label><input type="text" name="mqttClientId" onChange={handleChangeMqttClientId} value={mqttClientId}></input></div>
          <div><label>username: </label><input type="text" name="mqttUserName" onChange={handleChangeMqttUserName} value={mqttUserName}></input></div>
          <div><label>password: </label><input type="password" name="mqttPassword" onChange={handleChangeMqttPassword} value={mqttPassword}></input></div>
        </form>
      </section>
      <section>
        <h2>Publish</h2>
        <form onSubmit={handlePublishMessage}>
          <div>
            <label>topic: </label><input type="text" onChange={handleChangeSendTopic} value={publishTopic}></input>
          </div>
          <div>
            <label>message: </label><textarea onChange={handleChangePublishMessage} value={publishMessage}></textarea>
            <label>QoS: </label><input type="number" min={0} max={2} onChange={handleChangePublishQos} value={publishQos}></input>
            <label>retain: </label><input type="checkbox" onChange={handleChangeRetain} checked={isRetain}></input>
          </div>
          <button type="submit" disabled={false}>publish</button>
        </form>
      </section>
      <section>
        <h2>Subscribe</h2>
        <form onSubmit={handleSubmitAddSubscribeTopic}>
          <label>add subscribe topic: </label><input type="text" onChange={handleChangeSubscribeTopic} value={addSubscribingTopic}></input>
          <label>QoS: </label><input type="number" min={0} max={2} onChange={handleChangeSubscribeQos} value={subscribeQos}></input>
          <button type="submit" disabled={false}>start subscribe</button>
        </form>
        <section>
          <h2>subscribing topics</h2>
          <ul>
            {[...subscribingTopics.values()].map((e) => <Fragment key={e.name}><li>{e.name}, QoS: {e.qos}<button value={e.name} onClick={handleDeleteSubscribeTopic}>delete</button></li></Fragment>)}
          </ul>
        </section>
        <section>
          <h2>received messages:</h2>
          <ul>
            {receivedMessages.map((e,i) => <li key={i}>{e}</li>)}
          </ul>
        </section>
      </section>
    </div>
  )
}

export default App
