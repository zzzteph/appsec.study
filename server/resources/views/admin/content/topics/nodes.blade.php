@include('include.header')

	 <script src="{{asset('js/viz.js')}}" type="text/javascript"></script>
	 <script src="{{asset('js/full.render.js')}}" type="text/javascript"></script>
	 

	 
	 <section class="section">
		 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">
		  <ul>
		    <li><a href="{{route('admin-view-courses')}}">Courses</a></li>
			<li><a href="#">{{$course->name}}</a></li>
			<li class="is-active"><a href="{{route('lessons',['course_id' => $course->id,'topic_id' => $topic->id])}}">{{$topic->name}}</a></li>
		  </ul>
	</nav>
	


<form method="POST" action="{{route('admin-nodes-update',['course_id' => $course->id,'topic_id' => $topic->id])}}">
  @method('PUT')
  @csrf

	


<div class="columns">
<div class="column">
<div class="field">
  <label class="label">Nodes</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="nodes" id="nodes">

 [
 @foreach ($topic->topic_nodes as $node)
{"id":{{$node->node_id}},"lesson":"{{$node->lesson_id}}"}
   @if (!$loop->last)
   ,
   @endif
@endforeach
 ]



</textarea>
	
  </div>
</div>
</div>
<div class="column">
<div class="field">
  <label class="label">Routes</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="routes" id="routes">


 [
 @foreach ($topic->topic_routes() as $route)
 

		{"from":{{$route->from_node->node_id}},"to":{{$route->to_node->node_id}},"condition":"{{$route->condition}}"}
		@if (!$loop->last )
		,
		@endif
   

@endforeach
 ]






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
	var ugly = document.getElementById('nodes').value;
    var obj = JSON.parse(ugly);
    var pretty = JSON.stringify(obj, undefined, 4);
    document.getElementById('nodes').value = pretty;

	var ugly = document.getElementById('routes').value;
    var obj = JSON.parse(ugly);
    var pretty = JSON.stringify(obj, undefined, 4);
    document.getElementById('routes').value = pretty;




	var nodes ='';
	var routes ='';
var graph="";
 try {
	nodes=JSON.parse(document.getElementById('nodes').value);
routes=JSON.parse(document.getElementById('routes').value);
	for (var i = 0; i < nodes.length; i++) {
   graph+=nodes[i].id+' [shape='+getLessonType(nodes[i].lesson)+',label="'+getLessonName(nodes[i].lesson)+'"];\n';

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
    document.getElementById('error').appendChild("Erorr");
    }
console.log( graph);
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