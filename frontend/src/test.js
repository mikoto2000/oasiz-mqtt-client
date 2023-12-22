import mqtt from 'mqtt';

let newClient = mqtt.connect(
  'ws://host.docker.internal:9090/mqtt',
  {
    username: 'myuser',
    password: 'password',
    keepalive: 30
});

newClient.on('connect', () => {
  console.log(`connected`);
  console.log('subscribe Topic: "testtopic/#", QoS: 0');
  newClient.subscribe("testtopic/#", { qos: 0 });
  console.log('subscribe Topic: "testtopic/#", QoS: 1');
  newClient.subscribe("testtopic/#", { qos: 1 });
});

newClient.on('message', (topic, payload, packet) => {
  let newMessage = `${topic} : ${payload.toString()}`;
  console.log(`on message ${newMessage}`);
});

