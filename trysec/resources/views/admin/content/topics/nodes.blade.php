@include('include.header')

	 <script src="{{asset('js/viz.js')}}" type="text/javascript"></script>
	 <script src="{{asset('js/full.render.js')}}" type="text/javascript"></script>
	 

	 
	 <section class="section">
		 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">
		  <ul>
			<li class="is-active"><a href="{{route('lessons',['topic_id' => $topic->id])}}">{{$topic->name}}</a></li>
		  </ul>
	</nav>
	


<form method="POST" action="{{route('admin-nodes-update',['topic_id' => $topic->id])}}">
  @method('PUT')
  @csrf

	


<div class="columns">
<div class="column">
<div class="field">
  <label class="label">Nodes</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="nodes" id="nodes">
@foreach ($topic->topic_nodes as $node)
@isset($node->topic_node_condition->type)
{{$node->node_id}},{{$node->lesson_id}},{{$node->topic_node_condition->type}},{{$node->topic_node_condition->value}}
@else
{{$node->node_id}},{{$node->lesson_id}}
@endisset
@endforeach
</textarea>
	
  </div>
</div>
</div>
<div class="column">
<div class="field">
  <label class="label">Routes</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="routes" id="routes">
@foreach ($topic->topic_routes() as $route)
{{$route->from_node->node_id}}->{{$route->to_node->node_id}},{{$route->condition}}
@endforeach
</textarea>
	
  </div>
</div>
</div>



<div class="column">
<div class="field">
  <label class="label">Lessons</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" >
@foreach ($lessons as $lesson)
{{$lesson->name}} - {{$lesson->id}}
@endforeach
</textarea>
	
  </div>
</div>
</div>


</div>

<div class="field">
  <div class="control">
  <div id="error"></div>
  </div>
</div>


<div class="field">
  <div class="control">
    <button class="button is-success is-large">Save</button>
  </div>
</div>

<div class="field">
<label class="label">Map</label>
  <div class="control">
  <div id="map"></div>
  </div>
</div>


</form>


	 <script>
	 var lessons=[]
@foreach ($lessons as $lesson)
	lessons.push({"id":{{$lesson->id}},"type":'{{$lesson->type}}',"name":'{{$lesson->name}}'});
@endforeach

document.getElementById("nodes").addEventListener("input", (event) =>  parse());
document.getElementById("routes").addEventListener("input", (event) =>  parse());


function getLessonName(id)
{
	for (var i = 0; i < lessons.length; i++) {
		if(lessons[i].id==id)return lessons[i].name;
	}
	return FALSE;
}
	
function getLessonType(id)
{
	for (var i = 0; i < lessons.length; i++) {
		if(lessons[i].id==id)
		{
			console.log(lessons[i].type);
			if(lessons[i].type=='lab')return 'ellipse';
			if(lessons[i].type=='theory')return 'box';
			
		}
	}
	return FALSE;
}




	
function parse()
{
	var nodes =[];
	var routes =[];
var graph="";
 try {
	data=document.getElementById('nodes').value.split('\n');




for (var i = 0; i < data.length; i++) {

	line=data[i].split(','); 
	console.log(line.length);
	console.log(line);
  if(line.length==4)
	nodes.push({"id":line[0],"lesson":line[1],"timeout":line[3]});
  else if(line[0]!=null && line[1]!=null)
	  nodes.push({"id":line[0],"lesson":line[1]});
  
}
	for (var i = 0; i < nodes.length; i++) {
   graph+=nodes[i].id+' [shape='+getLessonType(nodes[i].lesson)+',label="'+getLessonName(nodes[i].lesson)+'"];\n';
}


	data=document.getElementById('routes').value.split('\n');
for (var i = 0; i < data.length; i++) {


var separators = ['->', ','];
	line=data[i].split(new RegExp(separators.join('|'), 'g'));
	
  if(line.length==3)
	routes.push({"from":line[0],"to":line[1],"condition":line[2]});
  else if(line[0]!=null && line[1]!=null)
	  routes.push({"from":line[0],"to":line[1],"condition":"none"});
  
}

	for (var i = 0; i < routes.length; i++) {
		if(routes[i].condition=='fail')
   graph+=routes[i].from+'->'+routes[i].to+ ' [color=red];\n';
else if(routes[i].condition=='success')
    graph+=routes[i].from+'->'+routes[i].to+ ' [color=green];\n';
else if(routes[i].condition=='none')
	 graph+=routes[i].from+'->'+routes[i].to+ ' [color=black];\n';
}
	 } catch(e) {
    console.log(e);
    }

var viz = new Viz();
  viz.renderSVGElement('digraph { '+ graph+' }')
  .then(function(element) {
	 document.getElementById('map').innerHTML = '';
    document.getElementById('map').appendChild(element);

  })
  .catch(error => {
    viz = new Viz();
    console.error(error);
  });
	
	
}	
parse();
</script>


    </div>

    </section>


@include('include.footer')