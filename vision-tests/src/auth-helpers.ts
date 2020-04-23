const logger = console;

interface LoginParams {
  uname: string,
  first: string,
  last: string,
  email: string,
  token: string
}

interface GAPI {
  gapi?: any;
}

type WindowGABI = Window & GAPI;

const getAuth = () => {
  const wg: WindowGABI = window;
  if (wg.gapi) {
    logger.debug("gapi is", wg.gapi);
    wg.gapi.load("auth2", () => {
      const auth2 = wg.gapi.auth2.init({
        client_id: "261855978313-003phramc3mt34d9gnvt2dmkp69ip4eu.apps.googleusercontent.com",
        fetch_basic_profile: true,
        scope: "profile"
      });
      auth2.isSignedIn.listen(() => logger.log("user is logged in"));
    });
  }
}

const getJWT = async (login: LoginParams): Promise<string> => {
  const origin = window.location.host;
  const {uname, email, token, first, last} = login;

  logger.log(`origin is: https://${origin}/login`);
  const resp = await fetch(`https://${origin}/login`, {
    method: "POST",
    cache: "no-cache",
    credentials: "same-origin",  // Setting this to same-origin to allow cookies
    headers: {
      "Content-Type": "application/json"
    },
    redirect: "follow",
    // Same as LoginParams in khadga code
    body: JSON.stringify({
      uname,
      first,
      last,
      email,
      token
    })
  });

  // Should have the JWT now if credentials now
  if (resp.status !== 200) {
    throw new Error(`Could not get JWT token: ${await resp.text()}`);
  }

  const jwt = await resp.text();
  return jwt;
}

export const checkCookie = (cname: string) => {
  return document.cookie.split(";")
    .map(c => c.trim())
    .map((c) => {
      if (c === cname) {
        logger.log("cookie: ", c);
      }
      return c;
    })
    .filter(c => c.includes(cname))
    .map(c => c.split("=")[1].trim());
}

export const signin = (googleUser: any, auth: any) => {
  const profile = googleUser.getBasicProfile();
  const firstName = profile.getGivenName() as string;
  const lastName = profile.getFamilyName() as string;
  const username: string = profile.getName();
  const email: string = profile.getEmail();
  const id = profile.getId();
  const url: string = profile.getImageUrl();

  let user = email.split("@")[0];
  user = user.replace(/[.+]/, "_");

  logger.debug(`Name: ${username}\nEmail: ${email}\nId: ${id}\nURL: ${url}`);
  logger.info(`Full name is ${firstName} ${lastName}`);

  logger.log("Getting auth response");
  try {
    const authResp = googleUser.getAuthResponse();
    logger.log("auth: ", authResp);
    getJWT({
      uname: username,
      first: firstName,
      last: lastName,
      email,
      token: authResp.id_token
    }).then((_) => {
      checkCookie("expiry");
    }).catch((ex) => {
      logger.error(ex);
    });
  } catch (ex) {
    logger.error(ex);
    auth.signOut();
  }
  // TODO: We should look at the existing cookie, and modify what's needed. Eventually, if we use
  // custom headers for JWT, we can sign the header with the user's public key and safely store
  // the JWT token in the cookie. If an attacker somehow sniffed or stole the JWT, they would
  // also need access to the private key (which if they have, all bets are off anyway)
}