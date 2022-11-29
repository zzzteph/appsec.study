@include('include.header')

	 <section class="section">
		 <div class="container"  id="app">

		
			<form method="POST" action="{{route('admin-create-lab-lesson-questions',['id' => $lesson->lesson_id])}}">
			



<div class="field">
  <label class="label">Content</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="content"></textarea>
	
  </div>
</div> 

	
  <div class="field">
    <label class="label">Question type</label>
    <div class="control">
      <div class="select">
        <select name="type" @change="onChange($event)" >
          <option value="yes" selected>Yes button</option>
          <option value="string">Single answer</option>
		  <option value="repeat">Repeatable answers</option>
		  <option value="vuln">Vulnerability search</option>
        </select>
      </div>
    </div>
  </div>	
	
	
<div class="field">
  <label class="label">Score</label>
  <div class="control">
		<input class="input" type="text" placeholder="100" name="score" value="100">
  </div>
</div>


  <template v-if="type === 'yes'">
  @csrf

  <div class="field">
  <div class="control">
    <button class="button is-link">Save</button>
  </div>
</div>
  </template>

	
	
  <template v-if="type === 'string'">
  @csrf
	<div class="field">
	  <label class="label">Answer</label>
	  <div class="control">
			<input class="input" type="text" placeholder="Answer" name="answer" value="">
	  </div>
	</div>

	

  <div class="field">
  <div class="control">
    <button class="button is-link">Save</button>
  </div>
</div>
  </template>


  <template v-if="type === 'repeat' || type === 'vuln'">
  @csrf
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
  
  </template>

	










    </div>

    </section>
<script>
var app = new Vue({
  el: '#app',
  data: {
    type:"yes",
	answers: [{ answer: "" }],
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


@include('include.footer')