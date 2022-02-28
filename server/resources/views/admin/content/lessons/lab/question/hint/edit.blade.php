@include('include.header')

	 <section class="section">
		 <div class="container">
		 <p>
		 {{$question->question}}
		 </p>
			<form method="POST" action="{{route('admin-update-lab-lesson-question-hints',['question_id' => $question->id,'hint_id' => $hint->id])}}">
			@method('PUT')
			@csrf
				<div class="field">
				  <label class="label">Hint</label>
				  <div class="control">
					<textarea class="textarea" placeholder="Textarea" name="hint">{{$hint->hint}}</textarea>
				  </div>
				</div> 

				<div class="field">
				  <label class="label">Price</label>
				  <div class="control">
						<input class="input" type="text" placeholder="100" name="price" value="{{$hint->price}}">
				  </div>
				</div>
				<div class="field">
				  <div class="control">
					<button class="button is-success">Update</button>
				  </div>
				</div>
			</form>
		</div>
    </section>


@include('include.footer')