# GPT integrated single page app

monorepo for creating a GPT integrated single page app 
- serving dev prototype from within codespaces.
- I couldn't get vercel to work with node.js and a monorepo, so just using yarn dev on a linode instead
- with api ts-node and express
- single page frontend in react
- auth0 for oauth

### Frontend:
Based roughly on this tutorial: 
https://developer.auth0.com/resources/guides/spa/react/basic-authentication

Built with assistance from aider, and drawing from the code here: https://github.com/auth0-developer-hub/spa_react_javascript_hello-world/tree/basic-authentication

### Backend
Built with aider with some reference to auth0 guides online somewhere that were written in js and aider made into ts.

## Notes

In the Auth0 dashboard you will need to create three distinct apps:

1. api
2. Single page application for the react frontend
3. Machine to Machine application for connecting to GPT (although, the application will connect via proxy auth and token paths given in the api)

## Set up api application first for auth0

1. In auth0 dashboard, go to apis (may be under applications heading). Create an api
2. Create API form: 
- Choose a name for your api. 
- Choose an identifier/audience value. The identifier (aka audience) is an arbitrary value. Best practice says it should be a relevant url. It is an identifier and MUST MATCH. So whatever you pick here should match the environment values in both the frontend and api local environment files. After you select this, update your .env.local file in both the api and frontend folders to include this value. see the .env.local.template files for the necessary variables.
- Leave JWT profile as default (Auth0)
- Leave algorithm as default (RS256)
3. If you go to the Machine-to-machine applications tab, you will see that an mtm test application has been automatically generated. We will adapt this later as the access point that open ai will connect to the api. In the mean time, click on that test application and copy the auth0 domain from it. Put this domain variable in your api .env.local file in the appropriate place. Note that this variable is the same for all apis and applications under your auth0 dashboard.
4. You still have to add the CLIENT_ORIGIN_URL. This will be the url of your frontend server forwarded by codespaces. It will be the same as the api address (except with a different port number) This is required by the api so it can provide the appropriate headers to avoid CORS issues when accessing via a browser. Remember, don't add a slash to the end of this address!
4. Run `yarn dev` in the api folder to start the server.  Make it public.


Example content of .env.local for api folder:

```
# EXAMPLE ONLY - DO NOT USE THESE VALUES
PORT=6060
CLIENT_ORIGIN_URL=https://vigilant-space-guide-wx5xwpppr6f577-4040.app.github.dev
AUTH0_DOMAIN=dev-s1yj8dwdfv6otxhv.us.auth0.com
AUTH0_AUDIENCE=https://hello-world.example.com
```

## Single page application setup for auth0:

1. Create a single page application from the auth0 dashboard
2. Select react as your technology
3. Once app is created, you need to populate the .env file in your frontend folder.
4. Create a .env file using the .env.template in the frontend as a starting point
5. Populate the VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID with the values from your auth0 application
6. To get your callback URL you will have to start your frontend client with `yarn dev` run from the frontend directory. Make sure you make this port public (go to ports settings in vscode). The callback is the address of this server with /callback appended (note this is different from the auth0 quickstart instructions) See example env variable below
7. Put the audience in the env that you used for the api. THESE MUST MATCH
8. To get the api server URL, look at where it is being served in ports tab in vscode, and copy the  address. Make sure it doesn't end with a slash (see sample env values below)
9. The callback address is the address for the frontend server, but with `/callback` appended. In codespaces, it will be the same as the api address, except with 4040 instead of 6060 as the port (and with /callback appended)
10. You will need to add a few allowed address to the auth0 application dashboard:
- Callback address (e.g `https://vigilant-space-guide-wx5xwpppr6f577-4040.app.github.dev/callback`)
- allowed web origins (the root url - eg: `https://vigilant-space-guide-wx5xwpppr6f577-4040.app.github.dev`)
- allowed logout address (same as above eg: `https://vigilant-space-guide-wx5xwpppr6f577-4040.app.github.dev`) 
11. start the frontent server with `yarn dev` from the `frontend` folder
12. The single page app should now work, including logins 

Example of what your env values might look like: 
```
# EXAMPLE ONLY - DO NOT USE THESE VALUES
VITE_AUTH0_DOMAIN=dev-s1yj8dwdfv6otxhv.us.auth0.com
VITE_AUTH0_CLIENT_ID=FpHcS4CxLfgST5zdnY3CNFuT6ugniEpI
VITE_AUTH0_CALLBACK_URL=https://vigilant-space-guide-wx5xwpppr6f577-4040.app.github.dev/callback
VITE_AUTH0_AUDIENCE=https://hello-world.example.com
VITE_API_SERVER_URL=https://vigilant-space-guide-wx5xwpppr6f577-6060.app.github.dev
```

## What to put in the GPT thingo

1. Go to open ai
2. Create a GPT
3. Go to actions, paste in the contents of api/openapi.json. You will need to update the server URL to match your API url. This url should not end in a slash.
Example:
```
  "servers": [
    {
      "url": "https://legendary-potato-p9w9x44x79369jr-6060.app.github.dev"
    }
  ]
```
4. In auth0 dashboard, go back to the mtm application that was created as a test with your API. rename it to something like: "template_GPT_access"
5. Go to advanced settings. Under grant types, allow authorisation_code. Save changes
6. copy and paste in the client id and the secret from the auth0 mtm application into the GPT authorisation form (remember to select oauth when choosing authorisation type)
7. You have to input the *custom api endpoints* from your api into the fields for auth and token in the GPT authorisation form. In this template app, those are given as 

<api_server_url>/api/oauth/auth
and
<api_server_url>/api/oauth/token,

for example:

https://vigilant-space-guide-wx5xwpppr6f577-6060.app.github.dev/api/oauth/token

- Leave the token thing as default (POST) or whatever
- remember to actually click SAVE. It isn't obvious if you forget to save, the UX is terrible for GPTs
8. You need to then go back to the previous menu so you can see the callback url underneath the actions button. It should look something like: https://chat.openai.com/aip/xxxx/oauth/callback
9. Save/ update the GPT (you need to do this often as UX still sucks and work can easily be lost and it is hard to tell when this happens)
10. Copy that callback into the auth0 dashboard for the MTM application under allowed callbacks and save changes

11. NOTE THAT THE UX SUCKS. 
- Changing either the authorisation settings or the openapi.json can result in the callback url changing. Until you update that in the auth0 dash, your GPT will be broken. This can result in a lot of frustrataion and a very annoying dev loop. Remember to save the auth0 dashboard settings after pasting in an updated callback url! 
- Sometimes updating openapi.json will cause some sort of issue where you need to re-enter your client ID and client secret and resave the authorisation information. This might, or might not, again trigger a new callback URL. I don't know why these issues happen but they are very annoying and because there are no error messages, hard to diagnose. Generally if attempting to login leads you to an "undefined" url, this means your callback doesn't match, or possibly that you need to re-enter and save your auth details in the GPT UI. However, sometime you will also get an auth0 page telling you that is the issue as well. SO it is very hard to say what is going on.

12. At this point you should also be able to sign into and access your protected API via your GPT. Congratulations.

## What to do with the callback

- Have to exit the GPT screen and copy paste the callback into auth0

## Open API spec

- No way of generating this at the moment - recommend using LLM to generate it, though apparently tools exist

---

## NOTES: This is from the tutorial and seems important but hasn't been followed:

A best practice when working with Auth0 is to have different tenants for your different project environments. For example, it's recommended for developers to specify a production tenant. A production tenant gets higher rate limits than non-production tenants. Check out the "Set Up Multiple Environments" Auth0 document to learn more about how to set up development, staging, and production environments in the Auth0 Identity Platform.

----

Ridiculous issue that took me a billion years to fix:

If the audience isn't specified when the authorize endpoint is called, auth0 issues a weird JWE/opaque token instead of simply failing. This causes bizzare problems. To fix this, you need to specify the audience within the custom auth and token endpoints in your api. The audience is appended at the end of the auth request in oauth.service.ts
