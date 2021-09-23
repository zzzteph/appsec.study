@include('include.header')
	 <section class="section">
		 <div class="container"  id="app">

		
<form method="POST" action="{{route('admin-update-lab-lesson-questions',['id' => $lesson->lesson_id,'question_id' => $question->id])}}">
			@method('PUT')
			@csrf
<div class="field">
  <label class="label">Content</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="content">{{$question->question}}</textarea>
	
  </div>
</div> 

<div class="field">
  <label class="label">Score</label>
  <div class="control">
		<input class="input" type="text" placeholder="100" name="score" value="{{$question->score}}">
  </div>
</div>


 	@if($question->type=='yes')
  @csrf

  <div class="field">
  <div class="control">
    <button class="button is-link">Save</button>
  </div>
</div>
  </template>
	@endif
	
	@if($question->type=='string')

  @csrf
	<div class="field">
	  <label class="label">Answer</label>
	  <div class="control">
	  			<input class="input" type="text" placeholder="Answer" name="answer" value="{{$question->answer->answer}}">
	  </div>
	</div>

	

  <div class="field">
  <div class="control">
    <button class="button is-link">Save</button>
  </div>
</div>

@endif

	@if($question->type=='repeat' || $question->type=='vuln')

  @csrf
   <label class="label">Answers: </label>
  <div class="field has-addons" v-for="(input, index) in answers" :key="`answers-${index}`">
  
    <div class="control">
		<input name="answers[]"  v-model="input.answer" class="input" type="text" placeholder="Answer" value="">
    </div>
	<div class="control">
  <a class="button is-danger" @click="removeField(index)">Remove</a>
</div>

  


</div>
<div class="field">
  <div class="control">
      <a class="button is-success" @click="addField()">Add</a>
	    </div>
</div>
	  
	  
<div class="field">
  <div class="control">
    <button class="button is-link">Save</button>
  </div>
</div>
  
@endif

	










    </div>

    </section>
	@if($question->type=='repeat' || $question->type=='vuln')
<script>

var app = new Vue({
  el: '#app',
  data: {
    type:"yes",
	answers: [
	 @foreach($question->answers as $answer)
	{ answer: "{{$answer->answer}}" },
	@endforeach
	],
  },
  methods: {
    onChange(event) {
            this.type=event.target.value;
        },
	addField() {
      this.answers.push({ answer: "" });
	  console.log(this.answers);
    },
    removeField(index) {
		
       this.answers.splice(index, 1);
   
   }
    }
  
  
})
</script>
@endif
@include('include.footer')