@include('include.header')





	 <section class="section">
		 <div class="container">

		
			<form method="POST" action="{{route('admin-create-lab-lesson-questions',['id' => $lesson->lesson_id])}}">
			@csrf



<div class="field">
  <label class="label">Content</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="question"></textarea>
	
  </div>
</div> 

	

<div class="field">
  <label class="label">Answer</label>
  <div class="control">
		<input class="input" type="text" placeholder="Answer" name="answer" value="">
  </div>
</div>


<div class="field">
  <label class="label">Score</label>
  <div class="control">
		<input class="input" type="text" placeholder="100" name="score" value="100">
  </div>
</div>





<div class="field">
  <div class="control">
    <button class="button is-success is-large">Save</button>
  </div>
</div>
</form>


    </div>

    </section>



@include('include.footer')