/* eslint-disable func-names, no-console */
const passport = require('passport');
const session = require('express-session');
const redis = require('redis');
const request = require('request');
const moment = require('moment');
const RedisStore = require('connect-redis')(session);
const LoginStrategy = require('./Strategy').Strategy;

export default function setUpOIDC(app, port, indexPath) {
  const hostname = process.env.HOSTNAME || `http://localhost:${port}`;
  /* ********* Setup OpenID Connect ********* */
  const callbackPath = '/oid_callback'; // connect callback path
  // Use Passport with OpenId Connect strategy to authenticate users
  const OIDCHost = process.env.OIDCHOST || 'https://hslid-dev.t5.fi';
  const FavouriteHost =
    process.env.FAVOURITE_HOST || 'https://dev-api.digitransit.fi/favourites';

  const RedisHost = process.env.REDIS_HOST || 'localhost';
  const RedisPort = process.env.REDIS_PORT || 6379;
  const RedisKey = process.env.REDIS_KEY;
  const RedisClient = RedisKey
    ? redis.createClient(RedisPort, RedisHost, {
        auth_pass: RedisKey,
        tls: { servername: RedisHost },
      })
    : redis.createClient(RedisPort, RedisHost);
  const oic = new LoginStrategy({
    issuerHost:
      process.env.OIDC_ISSUER || `${OIDCHost}/.well-known/openid-configuration`,
    client_id: process.env.OIDC_CLIENT_ID,
    client_secret: process.env.OIDC_CLIENT_SECRET,
    redirect_uri:
      process.env.OIDC_CLIENT_CALLBACK ||
      `http://localhost:${port}${callbackPath}`,
    post_logout_redirect_uris: [`${hostname}/logout/callback`],
    scope: 'openid profile',
  });

  const redirectToLogin = function (req, res, next) {
    const { ssoValidTo, ssoToken } = req.session;
    const paths = [
      '/fi/',
      '/en/',
      '/sv/',
      '/reitti/',
      '/pysakit/',
      '/linjat/',
      '/terminaalit/',
      '/pyoraasemat/',
      '/lahellasi/',
    ];
    // Only allow sso login when user navigates to certain paths
    // Query parameter is string type
    if (
      req.query.sso !== 'false' &&
      (req.path === `/${indexPath}` ||
        paths.some(path => req.path.includes(path))) &&
      !req.isAuthenticated() &&
      ssoToken &&
      ssoValidTo &&
      ssoValidTo > moment().unix()
    ) {
      console.log(
        'redirecting to login with sso token ',
        JSON.stringify(ssoToken),
      );
      req.session.returnTo = req.path;
      res.redirect('/login');
    } else {
      next();
    }
  };

  // Passport requires session to persist the authentication
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'reittiopas_secret',
      store: new RedisStore({
        host: RedisHost,
        port: RedisPort,
        client: RedisClient,
        ttl: 1000 * 60 * 60 * 24 * 365 * 10,
      }),
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        sameSite: 'none',
      },
    }),
  );
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use('passport-openid-connect', oic);
  passport.serializeUser(LoginStrategy.serializeUser);
  passport.deserializeUser(LoginStrategy.deserializeUser);

  app.use(redirectToLogin);

  // Initiates an authentication request
  // users will be redirected to hsl.id and once authenticated
  // they will be returned to the callback handler below
  app.get(
    '/login',
    passport.authenticate('passport-openid-connect', {
      scope: 'profile',
      successReturnToOrRedirect: '/',
    }),
  );
  // Callback handler that will redirect back to application after successfull authentication
  app.get(
    callbackPath,
    passport.authenticate('passport-openid-connect', {
      callback: true,
      successReturnToOrRedirect: `/${indexPath}`,
      failureRedirect: '/login',
    }),
  );
  app.get('/logout', function (req, res) {
    const logoutUrl = `${oic.client.endSessionUrl()}&id_token_hint=${
      req.user.token.id_token
    }`;
    res.redirect(logoutUrl);
  });
  app.get('/logout/callback', function (req, res) {
    req.logout();
    req.session.destroy(function () {
      res.clearCookie('connect.sid');
      res.redirect(`/${indexPath}`);
    });
  });
  app.get('/sso/auth', function (req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      req.session.ssoToken = req.query['sso-token'];
      req.session.ssoValidTo =
        Number(req.query['sso-validity']) * 60 * 1000 + moment().unix();
      res.send();
    }
  });
  app.use('/api', function (req, res, next) {
    res.set('Cache-Control', 'no-store');
    if (req.isAuthenticated()) {
      next();
    } else {
      res.sendStatus(401);
    }
  });
  /* GET the profile of the current authenticated user */
  app.get('/api/user', function (req, res) {
    request.get(
      `${OIDCHost}/openid/userinfo`,
      {
        auth: {
          bearer: req.user.token.access_token,
        },
      },
      function (err, response, body) {
        if (!err && response.statusCode === 200) {
          res.status(response.statusCode).send(body);
        } else {
          res.status(401).send('Unauthorized');
        }
      },
    );
  });
  app.use('/api/user/favourites', function (req, res) {
    request(
      {
        auth: {
          bearer: req.user.token.id_token,
        },
        method: req.method,
        url: `${FavouriteHost}/${req.user.data.sub}`,
        body: JSON.stringify(req.body),
      },
      function (err, response, body) {
        if (!err) {
          res.status(response.statusCode).send(body);
        } else {
          res.status(404).send(body);
        }
      },
    );
  });
}
