const twilio = require("twilio");

exports.handler = async function (context, event, callback) {
  const { ACCOUNT_SID, API_KEY_SID, API_KEY_SECRET, TWILIO_CHAT_SERVICE_SID } =
    context;
  const accessToken = new twilio.jwt.AccessToken(
    ACCOUNT_SID,
    API_KEY_SID,
    API_KEY_SECRET
  );
  accessToken.identity = event.username;

  const grant = new twilio.jwt.AccessToken.VideoGrant({
    room: "miduroom",
  });

  const chatGrant = new twilio.jwt.AccessToken.ChatGrant({
    serviceSid: TWILIO_CHAT_SERVICE_SID,
  });

  accessToken.addGrant(grant);
  accessToken.addGrant(chatGrant);

  callback(null, {
    token: accessToken.toJwt(),
  });
};
