try {
    // for Node.js
    var autobahn = require('autobahn');
  } catch (e) {
    // for browsers (where AutobahnJS is available globally)
  }
  
//Tentativa (não tão) frustada de criar um objeto para a conexão
function WAMPConnection() {
    var self = this;
    
    // variávies de configuração
    self.max_retries = 1;

    // variáveis reservadas
    self._connection;
    self.session;
    self._urls;
    self._connection_tries;
    self._user_id;
    self._user_secret;
    self._prefixo = 'com.app';

    self._newconnection = function(url) {
      self._connection = new autobahn.Connection(
      {
        url: url,
        realm: 'realm1',
        max_retries: self.max_retries,

        authmethods: ["wampcra"],
        authid: self._user_id,
        onchallenge: self._onchallenge
      });

      self._connection.onopen = self._onopen;
      self._connection.onclose = self._onclose;
      self._connection.open();
    };

    self._onopen = function(session) {
      console.log('Conectado em:', self._connection.transport.info.url);
      self.session = session;
      self.session.prefix('pre', self._prefixo)

      self.onopen(session);
    };

    self._onclose = function(reason, details) {
      // connection closed, lost or unable to connect
      console.log('Reason:', reason);
      console.log('Details:', details);
      
      // executa ações de término de conexão só se a conexão foi realmente estabelecida
      // em algum momento
      if (reason == 'closed' || reason == 'lost')
        self.onclose(reason, details);
      
      else {
        if (details && !details.will_retry) {
          
          ++self._connection_tries;
          
          if (self._connection_tries < self._urls.length) 
            self._newconnection(self._urls[self._connection_tries]);
        }
      }
    };

    self._onchallenge = function(session, method, extra) {
      //console.log("onchallenge", method, extra);
      if (method === "wampcra") {
        //console.log("authenticating via '" + method + "' and challenge '" + extra.challenge + "'");

        return autobahn.auth_cra.sign(self._user_secret, extra.challenge);
      } else {
        throw "don't know how to authenticate using '" + method + "'";
      }
    };

    self.onopen;
    self.onclose;

    self.open = function(url_list, user_id, user_secret, prefixo) {
      self._urls = url_list;
      self._connection_tries = 0;
      
      self._prefixo = prefixo;

      self._user_id = user_id;
      self._user_secret = user_secret;
      
      self._newconnection(self._urls[0]);
    };

    self.close = function() {
      if (self._connection) self._connection.close();
    };

    self.status = function(info) {
      if (self.session != null) {
        return(self.session.call('pre:status', [info]));
      } else {
        log('Não conectado');
      }
    };

    self.ativar = function(msg) {
      if (self.session != null) {
        return(self.session.call('pre:ativar', [msg]));
      } else {
        log('Não conectado');
      }
    };

    self.send = function(msg) {
      if (self.session != null) {
        self.session.call('pre:atualizar', [msg]).then(
          function (res) {
            log('Raspi - ' + res);
          }
        );
      } else
        log('Não conectado');
    };
  }

/* // versão sem objeto
  var _connection;
  var _urls;
  var _connection_tries;
  var _max_retries;
  var _user_id;
  var _user_secret;

  function _newconnection(url) {
  _connection = new autobahn.Connection(
    {
      url: url,
      realm: 'realm1',
      max_retries: _max_retries,

      authmethods: ["wampcra"],
      authid: _user_id,
      onchallenge: _onchallenge
    });

    _connection.onopen = _onopen;
    _connection.onclose  = _onclose;
    _connection.open();
  }
  
  function _onopen(session) {
    console.log('Conectado em:', _connection.transport.info.url);
    
    onclose();
  }

  function _onclose(reason, details) {
    // connection closed, lost or unable to connect
    console.log('Reason:', reason);
    console.log('Details:', details);
    if (details && !details.will_retry) {
      ++_connection_tries;
      if (_connection_tries < _urls.length) 
        _newconnection(_urls[_connection_tries]);
    }
    
    // executa ações de término de conexão só se a conexão foi realmente estabelecida
    // em algum momento
    if (reason == 'closed' || reason == 'lost')
      onclose();
  }

  function _onchallenge (session, method, extra) {
    //console.log("onchallenge", method, extra);
    if (method === "wampcra") {
        //console.log("authenticating via '" + method + "' and challenge '" + extra.challenge + "'");

        return autobahn.auth_cra.sign(_user_secret, extra.challenge);
    } else {
        throw "don't know how to authenticate using '" + method + "'";
    }
  }
  
  // funções a serem reescrevidas externamente
  var onopen = function() {};
  var onclose = function () {};

  function connect(urls, user_id, user_secret, max_retries = 1) {
    _urls = urls;
    _connection_tries = 0;
    _user_id = user_id;
    _user_secret = user_secret;
    _max_retries = max_retries;

    _newconnection(_urls[0]);
  }

  function disconnect() {
    if (_connection) _connection.close();
  }
 */

