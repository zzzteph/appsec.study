@include('include.header')
<section class="section">


	<div class="container" id="app">
<h1 class="title">Topic {{$topic->name}} content</h1>


  <form method="POST" action="{{route('admin-nodes-update',['topic_id'=>$topic->id])}}">
  @csrf
  @method('put')

  
    <div class="field has-addons" v-for="(input, index) in lessons" :key="`lessons-${index}`">
    <div class="control is-expanded">
      <div class="select is-fullwidth">
        <select name="lessons[]"  v-model="input.id">
			<option disabled selected value> -- theory -- </option>
            @foreach ($lessons as $lesson)
				@if($lesson->type=='lab' || $lesson->type=='quiz')
					@continue;
				@endif
                <option value="{{$lesson->id}}">{{$lesson->name}}</option>
            @endforeach
			<option disabled selected value> -- labs -- </option>
            @foreach ($lessons as $lesson)
				@if($lesson->type=='theory' || $lesson->type=='quiz')
					@continue;
				@endif
                <option value="{{$lesson->id}}">{{$lesson->name}}</option>
            @endforeach
						<option disabled selected value> -- quiz -- </option>
            @foreach ($lessons as $lesson)
				@if($lesson->type=='lab' || $lesson->type=='theory')
					@continue;
				@endif
                <option value="{{$lesson->id}}">{{$lesson->name}}</option>
            @endforeach
			
			
        </select>
      </div>
    </div>
	<div class="control">
  <a class="button is-danger" @click="removeLesson(index)">Remove</a>
</div>

  


</div>
<div class="field">
  <div class="control">
      <a class="button" @click="addLesson()">Add</a>
	    </div>
</div>




<div class="field">
  <div class="control">
    <button class="button is-link">Submit</button>
  </div>
</div>
</form>
</div>
</section>

<script>
var app = new Vue({
  el: '#app',
  data: {
	lessons: [
	
				  	@foreach ($nodes as $node)
		{id:"{{$node->lesson_id}}"},
	@endforeach
	
	
	],
  },
  methods: {
	addLesson() {
      this.lessons.push({ id: 0 });
    },
    removeLesson(index) {
       this.lessons.splice(index, 1);
   
   }
  
   
   
   
   
   
   
   
   
    }
  
  
})
</script>

@include('include.footer')