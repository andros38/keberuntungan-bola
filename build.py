import re,sys
d='source/'
h=open(d+'index.html').read()
css=open(d+'style.css').read()
js='' ; pre='const C=CONFIG;'
for f in ['physics.js','storage.js','game.js']:
    t=open(d+f).read()
    t=re.sub(r'^import .*$','',t,flags=re.M)
    t=t.replace('export ','')
    js+=t+'\n'+(pre if f=='physics.js' else '');pre=''
h=h.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
h=h.replace('<script type="module" src="game.js"></script>','<script>(()=>{'+js+'})();</script>')
open('Keberuntungan-Bola.html','w').write(h)
